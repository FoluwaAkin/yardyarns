-- ============================================================
-- Notifications
-- ============================================================

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  -- types: tenancy_verified | tenancy_rejected |
  --        like_post | like_review |
  --        comment_post | comment_review | reply
  title text NOT NULL,
  body text NOT NULL,
  link text,          -- relative URL to navigate to on click
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own_read"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Security-definer helper — lets triggers + server actions
-- insert notifications for any user without bypassing RLS globally
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type    text,
  p_title   text,
  p_body    text,
  p_link    text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link);
END;
$$;

-- ============================================================
-- Trigger: notify on like
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_owner_id uuid;
  v_username text;
  v_link     text;
BEGIN
  SELECT username INTO v_username FROM public.profiles WHERE id = NEW.user_id;

  IF NEW.post_id IS NOT NULL THEN
    SELECT user_id INTO v_owner_id FROM public.posts WHERE id = NEW.post_id;
    v_link := '/units/' || (SELECT unit_id FROM public.posts WHERE id = NEW.post_id);
  ELSIF NEW.review_id IS NOT NULL THEN
    SELECT user_id INTO v_owner_id FROM public.reviews WHERE id = NEW.review_id;
    v_link := '/units/' || (SELECT unit_id FROM public.reviews WHERE id = NEW.review_id);
  END IF;

  -- Don't notify yourself
  IF v_owner_id IS NOT NULL AND v_owner_id <> NEW.user_id THEN
    PERFORM public.create_notification(
      v_owner_id,
      CASE WHEN NEW.post_id IS NOT NULL THEN 'like_post' ELSE 'like_review' END,
      'New like',
      '@' || v_username || ' liked your ' ||
        CASE WHEN NEW.post_id IS NOT NULL THEN 'post' ELSE 'review' END,
      v_link
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_like_created
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE PROCEDURE notify_on_like();

-- ============================================================
-- Trigger: notify on comment
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_content_owner_id uuid;
  v_parent_owner_id  uuid;
  v_username         text;
  v_link             text;
  v_content_type     text;
BEGIN
  SELECT username INTO v_username FROM public.profiles WHERE id = NEW.user_id;

  IF NEW.post_id IS NOT NULL THEN
    SELECT user_id INTO v_content_owner_id FROM public.posts WHERE id = NEW.post_id;
    v_link         := '/units/' || (SELECT unit_id FROM public.posts WHERE id = NEW.post_id);
    v_content_type := 'post';
  ELSIF NEW.review_id IS NOT NULL THEN
    SELECT user_id INTO v_content_owner_id FROM public.reviews WHERE id = NEW.review_id;
    v_link         := '/units/' || (SELECT unit_id FROM public.reviews WHERE id = NEW.review_id);
    v_content_type := 'review';
  END IF;

  -- Notify content owner (unless commenting on own content)
  IF v_content_owner_id IS NOT NULL AND v_content_owner_id <> NEW.user_id THEN
    PERFORM public.create_notification(
      v_content_owner_id,
      'comment_' || v_content_type,
      'New comment',
      '@' || v_username || ' commented on your ' || v_content_type,
      v_link
    );
  END IF;

  -- Notify parent comment author if this is a reply (and they're different from content owner)
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_owner_id FROM public.comments WHERE id = NEW.parent_id;
    IF v_parent_owner_id IS NOT NULL
       AND v_parent_owner_id <> NEW.user_id
       AND v_parent_owner_id <> v_content_owner_id THEN
      PERFORM public.create_notification(
        v_parent_owner_id,
        'reply',
        'New reply',
        '@' || v_username || ' replied to your comment',
        v_link
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_created
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE PROCEDURE notify_on_comment();

-- Grant execute on the helper function to authenticated role
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

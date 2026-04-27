-- ============================================================
-- RentRate — Initial Schema
-- ============================================================

-- PROFILES
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- PROPERTIES
create table properties (
  id uuid primary key default gen_random_uuid(),
  name text,
  address text not null,
  city text not null,
  state text not null,
  country text not null default 'Nigeria',
  lat numeric,
  lng numeric,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- UNITS
create table units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  unit_identifier text not null,  -- "Flat 3B", "Block A Room 2"
  created_at timestamptz not null default now(),
  unique(property_id, unit_identifier)
);

-- TENANCIES
create table tenancies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  start_date date not null,
  end_date date,  -- null = current tenant
  agreement_url text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

-- REVIEWS
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  tenancy_id uuid references tenancies(id) on delete set null,
  period_start date not null,
  period_end date not null,
  body text not null,
  created_at timestamptz not null default now(),
  -- one review per user per unit per start month
  unique(user_id, unit_id, period_start),
  -- period must be between 7 and 31 days
  check ((period_end - period_start) >= 6 and (period_end - period_start) <= 30)
);

-- RATINGS (per aspect, per review)
create table ratings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  aspect text not null check (aspect in (
    'security', 'electricity', 'water',
    'landlord_responsiveness', 'landlord_relationship',
    'aesthetics', 'sanitation', 'amenities'
  )),
  score integer not null check (score between 1 and 5),
  unique(review_id, aspect)
);

-- POSTS (free-form text, not linked to a review period)
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now()
);

-- COMMENTS (polymorphic: on a review OR a post)
create table comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  -- exactly one of review_id / post_id must be set
  check (num_nonnulls(review_id, post_id) = 1)
);

-- LIKES (polymorphic)
create table likes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references reviews(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(review_id, post_id) = 1)
);

create unique index likes_review_user on likes(review_id, user_id) where review_id is not null;
create unique index likes_post_user on likes(post_id, user_id) where post_id is not null;

-- ============================================================
-- AGGREGATE SCORE VIEW (verified tenants only)
-- ============================================================
create or replace view unit_aggregate_scores as
select
  r.unit_id,
  ra.aspect,
  round(avg(ra.score)::numeric, 2) as avg_score,
  count(*) as review_count
from ratings ra
join reviews r on r.id = ra.review_id
join tenancies t on t.id = r.tenancy_id
where t.verification_status = 'verified'
group by r.unit_id, ra.aspect;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table properties enable row level security;
alter table units enable row level security;
alter table tenancies enable row level security;
alter table reviews enable row level security;
alter table ratings enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

-- profiles: public read, own write
create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_own_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_own_update" on profiles for update using (auth.uid() = id);

-- properties: public read, authenticated insert
create policy "properties_public_read" on properties for select using (true);
create policy "properties_auth_insert" on properties for insert with check (auth.uid() is not null);

-- units: public read, authenticated insert
create policy "units_public_read" on units for select using (true);
create policy "units_auth_insert" on units for insert with check (auth.uid() is not null);

-- tenancies: owner read, authenticated insert/update own
create policy "tenancies_own_read" on tenancies for select using (auth.uid() = user_id);
create policy "tenancies_own_insert" on tenancies for insert with check (auth.uid() = user_id);
create policy "tenancies_own_update" on tenancies for update using (auth.uid() = user_id);

-- reviews: public read, authenticated insert/update own
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_own_insert" on reviews for insert with check (auth.uid() = user_id);
create policy "reviews_own_update" on reviews for update using (auth.uid() = user_id);
create policy "reviews_own_delete" on reviews for delete using (auth.uid() = user_id);

-- ratings: public read, authenticated insert (must own review)
create policy "ratings_public_read" on ratings for select using (true);
create policy "ratings_own_insert" on ratings for insert with check (
  exists (select 1 from reviews where id = review_id and user_id = auth.uid())
);

-- posts: public read, authenticated insert/update/delete own
create policy "posts_public_read" on posts for select using (true);
create policy "posts_own_insert" on posts for insert with check (auth.uid() = user_id);
create policy "posts_own_update" on posts for update using (auth.uid() = user_id);
create policy "posts_own_delete" on posts for delete using (auth.uid() = user_id);

-- comments: public read, authenticated insert, own delete
create policy "comments_public_read" on comments for select using (true);
create policy "comments_auth_insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments_own_delete" on comments for delete using (auth.uid() = user_id);

-- likes: public read, authenticated insert/delete own
create policy "likes_public_read" on likes for select using (true);
create policy "likes_auth_insert" on likes for insert with check (auth.uid() = user_id);
create policy "likes_own_delete" on likes for delete using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-create profile on sign-up
-- ============================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, email_verified)
  values (
    new.id,
    -- default username from email local part, unique-ified with short id
    split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6),
    coalesce(new.email_confirmed_at is not null, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- GRANTS
-- RLS policies only restrict — base table grants must exist first
-- ============================================================
grant usage on schema public to anon, authenticated;

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

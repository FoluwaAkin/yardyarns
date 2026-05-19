-- ============================================================
-- Review pricing — optional commercial terms, verified-only
-- ============================================================

alter table reviews
  add column rent_amount numeric,
  add column rent_frequency text check (rent_frequency in ('annual', 'monthly')),
  add column service_charge numeric,
  add column agency_fee numeric,
  add column legal_fee numeric,
  add column caution_deposit numeric,
  add column currency text not null default 'NGN';

alter table reviews
  add constraint reviews_rent_freq_required
    check (rent_amount is null or rent_frequency is not null),
  add constraint reviews_rent_amount_nonneg
    check (rent_amount is null or rent_amount >= 0),
  add constraint reviews_service_charge_nonneg
    check (service_charge is null or service_charge >= 0),
  add constraint reviews_agency_fee_nonneg
    check (agency_fee is null or agency_fee >= 0),
  add constraint reviews_legal_fee_nonneg
    check (legal_fee is null or legal_fee >= 0),
  add constraint reviews_caution_deposit_nonneg
    check (caution_deposit is null or caution_deposit >= 0);

-- Defence-in-depth: pricing fields may only carry values on reviews
-- linked to a verified tenancy. The client also gates the UI, but
-- this prevents direct table writes from bypassing the rule.
create or replace function enforce_pricing_requires_verified_tenancy()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  has_pricing boolean := (
    new.rent_amount is not null
    or new.service_charge is not null
    or new.agency_fee is not null
    or new.legal_fee is not null
    or new.caution_deposit is not null
  );
  is_verified boolean := false;
begin
  if has_pricing then
    if new.tenancy_id is null then
      raise exception 'pricing fields require a verified tenancy';
    end if;
    select (verification_status = 'verified') into is_verified
      from public.tenancies where id = new.tenancy_id;
    if not coalesce(is_verified, false) then
      raise exception 'pricing fields require a verified tenancy';
    end if;
  end if;
  return new;
end;
$$;

create trigger reviews_pricing_guard
  before insert or update on reviews
  for each row execute procedure enforce_pricing_requires_verified_tenancy();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  business_name text,
  business_type text,
  city text,
  source text not null default 'generate_form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_email_lowercase check (email = lower(email)),
  constraint leads_source_valid check (source in ('generate_form', 'homepage'))
);

create index if not exists idx_leads_updated_at
  on public.leads (updated_at desc);

alter table public.leads enable row level security;
revoke all on table public.leads from anon, authenticated;

alter table public.profiles
  add column if not exists referral_code text
  generated always as (
    upper(left(replace(id::text, '-', ''), 12))
  ) stored;

create unique index if not exists idx_profiles_referral_code
  on public.profiles (referral_code);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  reward_amount_cents integer,
  created_at timestamptz not null default now(),
  rewarded_at timestamptz,
  constraint referrals_distinct_users check (referrer_user_id <> referred_user_id),
  constraint referrals_status_valid check (status in ('pending', 'rewarded')),
  constraint referrals_reward_nonnegative check (
    reward_amount_cents is null or reward_amount_cents >= 0
  )
);

create index if not exists idx_referrals_referrer_created_at
  on public.referrals (referrer_user_id, created_at desc);

create index if not exists idx_referrals_status
  on public.referrals (status);

alter table public.referrals enable row level security;
revoke all on table public.referrals from anon, authenticated;

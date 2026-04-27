create type public.app_role as enum ('admin', 'user');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile or admins read all"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

create policy "users can update own profile or admins update all"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
)
with check (
  (select auth.uid()) = id
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  whatsapp text not null,
  company text not null,
  niche text not null,
  interest text not null,
  source text not null,
  status text not null,
  notes text not null default '',
  next_meeting jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_leads enable row level security;

create policy "owners read own leads or admins read all leads"
on public.crm_leads
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

create policy "owners insert own leads or admins insert all leads"
on public.crm_leads
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

create policy "owners update own leads or admins update all leads"
on public.crm_leads
for update
to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
)
with check (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

create policy "owners delete own leads or admins delete all leads"
on public.crm_leads
for delete
to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

create table if not exists public.crm_lead_timeline (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  title text not null,
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.crm_lead_timeline enable row level security;

create policy "owners read own timeline or admins read all"
on public.crm_lead_timeline
for select
to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);

create policy "owners insert own timeline or admins insert all"
on public.crm_lead_timeline
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles as admin_profile
    where admin_profile.id = (select auth.uid())
      and admin_profile.role = 'admin'
  )
);


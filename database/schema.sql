-- Run this in your Supabase SQL editor.
-- It creates tables, RLS policies, seed data, and helper function for the BisTrack Support Portal.

create extension if not exists pgcrypto;

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.issue_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  department_id uuid references public.departments(id) on delete set null,
  role text not null default 'user' check (role in ('user','support','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  category_id uuid references public.issue_categories(id) on delete set null,
  title text not null,
  issue_description text not null,
  other_issue_text text,
  requester_name text not null,
  requester_email text not null,
  priority text not null check (priority in ('Low','Medium','High','Critical')) default 'Medium',
  urgency text not null check (urgency in ('Low','Medium','High','Urgent')) default 'Medium',
  status text not null check (status in ('New','In Progress','Waiting on User','Resolved - Awaiting Confirmation','Closed','Overdue')) default 'New',
  is_overdue boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.ticket_updates (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  status text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  bill_to text not null,
  billing_period_start date not null,
  billing_period_end date not null,
  total_hours numeric(10,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'Draft',
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  work_date date not null,
  hours_worked numeric(10,2) not null check (hours_worked >= 0),
  billing_rate numeric(10,2) not null default 125,
  notes text not null,
  billable boolean not null default true,
  invoice_id uuid references public.invoices(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  ticket_id uuid references public.tickets(id) on delete set null,
  time_entry_id uuid references public.time_entries(id) on delete set null,
  description text not null,
  hours numeric(10,2) not null,
  rate numeric(10,2) not null,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
before update on public.tickets
for each row
execute function public.handle_updated_at();

create or replace function public.is_support_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('support', 'admin')
  );
$$;

create or replace function public.get_ticket_list(p_user_id uuid default null, p_include_all boolean default false)
returns table (
  id uuid,
  title text,
  issue_description text,
  other_issue_text text,
  priority text,
  urgency text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz,
  requester_name text,
  requester_email text,
  department_name text,
  category_name text,
  is_overdue boolean
)
language sql
security definer
as $$
  select
    t.id,
    t.title,
    t.issue_description,
    t.other_issue_text,
    t.priority,
    t.urgency,
    t.status,
    t.created_at,
    t.updated_at,
    t.resolved_at,
    t.requester_name,
    t.requester_email,
    d.name as department_name,
    coalesce(ic.name, 'Uncategorized') as category_name,
    t.is_overdue
  from public.tickets t
  left join public.departments d on d.id = t.department_id
  left join public.issue_categories ic on ic.id = t.category_id
  where
    case
      when p_include_all then true
      else t.user_id = p_user_id
    end
  order by t.created_at desc;
$$;

grant execute on function public.get_ticket_list(uuid, boolean) to authenticated;

alter table public.departments enable row level security;
alter table public.issue_categories enable row level security;
alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_updates enable row level security;
alter table public.time_entries enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Read access
drop policy if exists "authenticated users can read departments" on public.departments;
create policy "authenticated users can read departments"
on public.departments for select to authenticated using (true);

drop policy if exists "authenticated users can read issue categories" on public.issue_categories;
create policy "authenticated users can read issue categories"
on public.issue_categories for select to authenticated using (true);

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles for select to authenticated using (id = auth.uid() or public.is_support_user());

drop policy if exists "users can read own tickets and support can read all" on public.tickets;
create policy "users can read own tickets and support can read all"
on public.tickets for select to authenticated
using (user_id = auth.uid() or public.is_support_user());

drop policy if exists "users can read related ticket updates" on public.ticket_updates;
create policy "users can read related ticket updates"
on public.ticket_updates for select to authenticated
using (
  exists (
    select 1 from public.tickets t
    where t.id = ticket_updates.ticket_id
      and (t.user_id = auth.uid() or public.is_support_user())
  )
);

drop policy if exists "support can read time entries" on public.time_entries;
create policy "support can read time entries"
on public.time_entries for select to authenticated using (public.is_support_user());

drop policy if exists "support can read invoices" on public.invoices;
create policy "support can read invoices"
on public.invoices for select to authenticated using (public.is_support_user());

drop policy if exists "support can read invoice items" on public.invoice_items;
create policy "support can read invoice items"
on public.invoice_items for select to authenticated using (public.is_support_user());

-- Write access
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "users can update own profile and support can update all" on public.profiles;
create policy "users can update own profile and support can update all"
on public.profiles for update to authenticated
using (id = auth.uid() or public.is_support_user())
with check (id = auth.uid() or public.is_support_user());

drop policy if exists "users can insert own tickets" on public.tickets;
create policy "users can insert own tickets"
on public.tickets for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "users can update own tickets and support can update all" on public.tickets;
create policy "users can update own tickets and support can update all"
on public.tickets for update to authenticated
using (user_id = auth.uid() or public.is_support_user())
with check (user_id = auth.uid() or public.is_support_user());

drop policy if exists "users can insert ticket updates tied to accessible tickets" on public.ticket_updates;
create policy "users can insert ticket updates tied to accessible tickets"
on public.ticket_updates for insert to authenticated
with check (
  exists (
    select 1 from public.tickets t
    where t.id = ticket_updates.ticket_id
      and (t.user_id = auth.uid() or public.is_support_user())
  )
);

drop policy if exists "support can insert time entries" on public.time_entries;
create policy "support can insert time entries"
on public.time_entries for insert to authenticated with check (public.is_support_user());

drop policy if exists "support can update time entries" on public.time_entries;
create policy "support can update time entries"
on public.time_entries for update to authenticated using (public.is_support_user()) with check (public.is_support_user());

drop policy if exists "support can insert invoices" on public.invoices;
create policy "support can insert invoices"
on public.invoices for insert to authenticated with check (public.is_support_user());

drop policy if exists "support can update invoices" on public.invoices;
create policy "support can update invoices"
on public.invoices for update to authenticated using (public.is_support_user()) with check (public.is_support_user());

drop policy if exists "support can insert invoice items" on public.invoice_items;
create policy "support can insert invoice items"
on public.invoice_items for insert to authenticated with check (public.is_support_user());

-- Seed values
insert into public.departments (name)
values
  ('Accounting'),
  ('Administration'),
  ('Counter Sales'),
  ('Dispatch'),
  ('Inventory'),
  ('Management'),
  ('Purchasing'),
  ('Warehouse')
on conflict (name) do nothing;

insert into public.issue_categories (name)
values
  ('Login / Password'),
  ('Printing'),
  ('Hardware'),
  ('Network / Internet'),
  ('BisTrack Error'),
  ('Order Entry'),
  ('Inventory Issue'),
  ('Customer Account Issue'),
  ('POS / Register'),
  ('Report / Document'),
  ('Slow Performance'),
  ('Other')
on conflict (name) do nothing;

-- After your first account is created, promote it manually if needed:
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';

-- Weekly Planner — Initiales Schema
-- Alle Tabellen sind strikt an auth.uid() gebunden (RLS Pflicht).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- mission

create table public.mission (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  -- eine Mission pro Nutzer
  unique (user_id)
);

create trigger mission_set_updated_at
  before update on public.mission
  for each row execute function public.set_updated_at();

create table public.mission_versions (
  id          uuid primary key default gen_random_uuid(),
  mission_id  uuid not null references public.mission (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

create index mission_versions_mission_idx
  on public.mission_versions (mission_id, created_at desc);

-- Bei jedem Speichern automatisch eine Version anlegen.
create or replace function public.snapshot_mission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.content is not distinct from old.content then
    return new;
  end if;
  insert into public.mission_versions (mission_id, user_id, content)
  values (new.id, new.user_id, new.content);
  return new;
end;
$$;

create trigger mission_snapshot
  after insert or update of content on public.mission
  for each row execute function public.snapshot_mission();

-- ---------------------------------------------------------------- roles

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (length(btrim(name)) > 0),
  description text not null default '',
  sort_order  integer not null default 0,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create index roles_user_idx on public.roles (user_id, archived, sort_order);

-- ---------------------------------------------------------------- goals

create table public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  role_id     uuid not null references public.roles (id) on delete cascade,
  title       text not null check (length(btrim(title)) > 0),
  description text not null default '',
  horizon     text not null check (horizon in ('short', 'long')),
  target_date date,
  status      text not null default 'open' check (status in ('open', 'done', 'dropped')),
  created_at  timestamptz not null default now()
);

create index goals_role_idx on public.goals (role_id, horizon, status);

-- ---------------------------------------------------------------- weeks

create table public.weeks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  start_date  date not null,
  status      text not null default 'planning' check (status in ('planning', 'active', 'closed')),
  created_at  timestamptz not null default now(),
  -- start_date muss ein Montag sein (ISO: 1 = Montag)
  constraint weeks_start_is_monday check (extract(isodow from start_date) = 1),
  unique (user_id, start_date)
);

create index weeks_user_idx on public.weeks (user_id, start_date desc);

-- ---------------------------------------------------------------- week_items

create table public.week_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  week_id     uuid not null references public.weeks (id) on delete cascade,
  role_id     uuid not null references public.roles (id) on delete restrict,
  goal_id     uuid references public.goals (id) on delete set null,
  title       text not null check (length(btrim(title)) > 0),
  quadrant    text not null default 'Q2' check (quadrant in ('Q1', 'Q2', 'Q3', 'Q4')),
  done        boolean not null default false,
  planned_day smallint check (planned_day between 0 and 6),
  start_time  time,
  end_time    time,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint week_items_time_order check (end_time is null or start_time is null or end_time > start_time)
);

create index week_items_week_idx on public.week_items (week_id, planned_day, sort_order);
create index week_items_role_idx on public.week_items (role_id);

-- ---------------------------------------------------------------- fixed_events

create table public.fixed_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null check (length(btrim(title)) > 0),
  weekday     smallint not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint fixed_events_time_order check (end_time > start_time)
);

create index fixed_events_user_idx on public.fixed_events (user_id, weekday, start_time);

-- ---------------------------------------------------------------- reviews

create table public.reviews (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  week_id          uuid not null references public.weeks (id) on delete cascade,
  wins             text not null default '',
  misses           text not null default '',
  learnings        text not null default '',
  next_week_focus  text not null default '',
  rating           smallint not null check (rating between 1 and 5),
  created_at       timestamptz not null default now(),
  unique (week_id)
);

-- ---------------------------------------------------------------- RLS

alter table public.mission           enable row level security;
alter table public.mission_versions  enable row level security;
alter table public.roles             enable row level security;
alter table public.goals             enable row level security;
alter table public.weeks             enable row level security;
alter table public.week_items        enable row level security;
alter table public.fixed_events      enable row level security;
alter table public.reviews           enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'mission', 'mission_versions', 'roles', 'goals',
    'weeks', 'week_items', 'fixed_events', 'reviews'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t || '_owner_all', t
    );
  end loop;
end;
$$;

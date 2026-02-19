-- Schema for Anchor couple spaces
-- Run in Supabase SQL editor. After creating tables, enable Realtime on events, moods, alerts, locations, snapshots.

create extension if not exists "uuid-ossp";

create table if not exists spaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists space_members (
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create table if not exists pairing_codes (
  code text primary key default substr(md5(random()::text), 1, 6),
  space_id uuid references spaces(id) on delete cascade,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- Use an RPC to redeem codes atomically
create or replace function redeem_pairing_code(p_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_space uuid;
begin
  update pairing_codes
    set used = true
    where code = p_code
      and used = false
      and expires_at > now()
    returning space_id into v_space;

  if v_space is not null then
    -- Add caller to space_members if not already present
    insert into space_members (space_id, user_id, role)
    values (v_space, auth.uid(), 'member')
    on conflict (space_id, user_id) do nothing;
  end if;

  return v_space;
end;
$$;

delete from pairing_codes where expires_at < now();

create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid references spaces(id) on delete cascade,
  creator_id uuid not null,
  title text not null,
  "dateTime" timestamptz not null,
  category text not null,
  note text,
  guardian_alert_enabled boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists moods (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid not null,
  mood text not null,
  created_at timestamptz not null default now()
);

create table if not exists alerts (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid references spaces(id) on delete cascade,
  trigger_user_id uuid not null,
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists snapshots (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid not null,
  uri text not null,
  created_at timestamptz not null default now()
);

create table if not exists locations (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid references spaces(id) on delete cascade,
  user_id uuid not null,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table spaces enable row level security;
alter table space_members enable row level security;
alter table pairing_codes enable row level security;
alter table events enable row level security;
alter table moods enable row level security;
alter table alerts enable row level security;
alter table snapshots enable row level security;
alter table locations enable row level security;

-- Only members of a space can see rows for that space.
create policy "spaces_select" on spaces for select using (
  auth.uid() = owner_id or exists(select 1 from space_members m where m.space_id = id and m.user_id = auth.uid())
);
create policy "spaces_insert" on spaces for insert with check (auth.uid() = owner_id);

create policy "members_select" on space_members for select using (auth.uid() = user_id);
create policy "members_insert" on space_members for insert with check (auth.uid() = user_id or auth.uid() in (select owner_id from spaces s where s.id = space_id));
create policy "members_delete" on space_members for delete using (auth.uid() = user_id or auth.uid() in (select owner_id from spaces s where s.id = space_id));

create policy "codes_select" on pairing_codes for select using (true);
create policy "codes_insert" on pairing_codes for insert with check (auth.uid() in (select owner_id from spaces s where s.id = space_id));
create policy "codes_update" on pairing_codes for update using (true);

create policy "events_all" on events for all using (auth.uid() in (select user_id from space_members m where m.space_id = space_id)) with check (auth.uid() in (select user_id from space_members m where m.space_id = space_id));
create policy "moods_all" on moods for all using (auth.uid() in (select user_id from space_members m where m.space_id = space_id)) with check (auth.uid() in (select user_id from space_members m where m.space_id = space_id));
create policy "alerts_all" on alerts for all using (auth.uid() in (select user_id from space_members m where m.space_id = space_id)) with check (auth.uid() in (select user_id from space_members m where m.space_id = space_id));
create policy "snapshots_all" on snapshots for all using (auth.uid() in (select user_id from space_members m where m.space_id = space_id)) with check (auth.uid() in (select user_id from space_members m where m.space_id = space_id));
create policy "locations_all" on locations for all using (auth.uid() in (select user_id from space_members m where m.space_id = space_id)) with check (auth.uid() in (select user_id from space_members m where m.space_id = space_id));

-- Enable realtime
-- In Supabase dashboard, Realtime > Tables: enable for events, moods, alerts, snapshots, locations.

-- Storage bucket
-- Create bucket "snapshots" (public or signed URLs). If private, use signed URLs in app.

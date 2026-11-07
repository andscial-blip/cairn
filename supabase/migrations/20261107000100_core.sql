-- Cassa e Fisco — core schema: identity, ledgers (fascicoli), roles, audit, sync, attachments.
-- Every table exposed to the API has RLS enabled. Helper functions are SECURITY DEFINER with a
-- pinned search_path so policies can't be subverted through search_path tricks.

create type public.app_role as enum ('read_only', 'operator', 'responsabile', 'admin', 'super_admin');

-- ---------------------------------------------------------------------------
-- Profiles: one per auth user. Created by trigger; status changed only by admins.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  display_name  text not null default '',
  status        text not null default 'active' check (status in ('active', 'suspended')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Ledgers ("fascicoli") and membership with a role per ledger.
-- ---------------------------------------------------------------------------
create table public.ledgers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 120),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null
);

create table public.ledger_members (
  ledger_id   uuid not null references public.ledgers (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.app_role not null default 'read_only',
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,
  primary key (ledger_id, user_id)
);
create index ledger_members_user_idx on public.ledger_members (user_id);

-- ---------------------------------------------------------------------------
-- Authorization helpers.
-- ---------------------------------------------------------------------------
create function public.role_rank(r public.app_role) returns int
language sql immutable as $$
  select case r when 'read_only' then 1 when 'operator' then 2 when 'responsabile' then 3
                when 'admin' then 4 when 'super_admin' then 5 end
$$;

create function public.is_active_user() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active')
$$;

create function public.has_ledger_role(p_ledger uuid, p_min public.app_role) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_active_user() and exists (
    select 1 from public.ledger_members m
    where m.ledger_id = p_ledger and m.user_id = auth.uid()
      and public.role_rank(m.role) >= public.role_rank(p_min))
$$;

create function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_active_user() and exists (
    select 1 from public.ledger_members m where m.user_id = auth.uid() and m.role = 'super_admin')
$$;

-- ---------------------------------------------------------------------------
-- Audit log: append-only. Written only by SECURITY DEFINER code; never updatable by clients.
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  ledger_id   uuid references public.ledgers (id) on delete cascade,
  user_id     uuid,
  action      text not null check (action in ('create','update','delete','validate','admin','sync','login')),
  entity      text not null,
  record_id   uuid,
  op_id       uuid,
  origin      text not null default 'online' check (origin in ('online','offline','system')),
  outcome     text not null default 'ok' check (outcome in ('ok','conflict','denied','error')),
  at          timestamptz not null default now(),
  details     jsonb not null default '{}'::jsonb
);
create index audit_logs_ledger_at_idx on public.audit_logs (ledger_id, at desc);

create function public.write_audit(p_ledger uuid, p_action text, p_entity text, p_record uuid,
                                   p_outcome text default 'ok', p_details jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.audit_logs (ledger_id, user_id, action, entity, record_id, op_id, origin, outcome, details)
  values (p_ledger, auth.uid(), p_action, p_entity, p_record,
          nullif(current_setting('cef.op_id', true), '')::uuid,
          coalesce(nullif(current_setting('cef.origin', true), ''), 'online'),
          p_outcome, p_details);
end $$;
revoke all on function public.write_audit(uuid, text, text, uuid, text, jsonb) from public, anon, authenticated;

-- Last line of defence: even the table owner role used by the API cannot rewrite history.
create function public.audit_logs_immutable() returns trigger language plpgsql as $$
begin raise exception 'audit_logs is append-only' using errcode = '42501'; end $$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
  for each row execute function public.audit_logs_immutable();

-- ---------------------------------------------------------------------------
-- Sync operations: one row per client operation UUID → idempotency key.
-- ---------------------------------------------------------------------------
create table public.sync_operations (
  op_id         uuid primary key,
  ledger_id     uuid not null references public.ledgers (id) on delete cascade,
  user_id       uuid not null default auth.uid(),
  entity        text not null,
  record_id     uuid not null,
  op_type       text not null check (op_type in ('upsert','delete')),
  base_version  int,
  client_ts     timestamptz,
  origin        text not null default 'offline' check (origin in ('online','offline')),
  status        text not null check (status in ('applied','conflict','rejected')),
  result        jsonb not null default '{}'::jsonb,
  received_at   timestamptz not null default now()
);
create index sync_operations_user_idx on public.sync_operations (user_id, received_at desc);

-- ---------------------------------------------------------------------------
-- Attachments metadata (files live in the private Storage bucket "attachments").
-- ---------------------------------------------------------------------------
create table public.attachments (
  id             uuid primary key,
  ledger_id      uuid not null references public.ledgers (id) on delete cascade,
  entity         text not null,
  record_id      uuid not null,
  storage_path   text not null unique,
  original_name  text not null check (length(original_name) between 1 and 255),
  mime_type      text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp','image/heic','text/csv')),
  size_bytes     bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  upload_status  text not null default 'pending' check (upload_status in ('pending','uploaded','failed')),
  version        int not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid default auth.uid(),
  updated_by     uuid,
  deleted_at     timestamptz,
  constraint attachments_path_in_ledger check (storage_path like ledger_id::text || '/%')
);
create index attachments_record_idx on public.attachments (ledger_id, entity, record_id);
create index attachments_sync_idx on public.attachments (ledger_id, updated_at);

-- ---------------------------------------------------------------------------
-- Per-ledger application settings (former "config/main").
-- ---------------------------------------------------------------------------
create table public.ledger_settings (
  ledger_id   uuid primary key references public.ledgers (id) on delete cascade,
  id          uuid not null unique default gen_random_uuid(),
  data        jsonb not null default '{}'::jsonb,
  version     int not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid default auth.uid(),
  updated_by  uuid,
  deleted_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.ledgers         enable row level security;
alter table public.ledger_members  enable row level security;
alter table public.audit_logs      enable row level security;
alter table public.sync_operations enable row level security;
alter table public.attachments     enable row level security;
alter table public.ledger_settings enable row level security;

-- profiles: see yourself (even if suspended, so the app can explain why); admins see members of their ledgers.
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or exists (
    select 1 from public.ledger_members me join public.ledger_members them on them.ledger_id = me.ledger_id
    where me.user_id = auth.uid() and them.user_id = profiles.id and public.role_rank(me.role) >= 4)
  and public.is_active_user());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid() and public.is_active_user()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (display_name, last_seen_at) on public.profiles to authenticated;

create policy ledgers_select on public.ledgers for select to authenticated
  using (public.has_ledger_role(id, 'read_only'));
create policy ledger_members_select on public.ledger_members for select to authenticated
  using (user_id = auth.uid() and public.is_active_user() or public.has_ledger_role(ledger_id, 'admin'));
-- Membership changes go through admin functions only (no insert/update/delete policies).

create policy audit_select on public.audit_logs for select to authenticated
  using (public.has_ledger_role(ledger_id, 'admin'));

create policy sync_ops_select on public.sync_operations for select to authenticated
  using (user_id = auth.uid() and public.is_active_user());
create policy sync_ops_insert on public.sync_operations for insert to authenticated
  with check (user_id = auth.uid() and public.has_ledger_role(ledger_id, 'operator'));

create policy settings_select on public.ledger_settings for select to authenticated
  using (public.has_ledger_role(ledger_id, 'read_only'));
create policy settings_write on public.ledger_settings for all to authenticated
  using (public.has_ledger_role(ledger_id, 'admin')) with check (public.has_ledger_role(ledger_id, 'admin'));

create policy attachments_select on public.attachments for select to authenticated
  using (public.has_ledger_role(ledger_id, 'read_only'));
create policy attachments_insert on public.attachments for insert to authenticated
  with check (public.has_ledger_role(ledger_id, 'operator'));
create policy attachments_update on public.attachments for update to authenticated
  using (public.has_ledger_role(ledger_id, 'operator')) with check (public.has_ledger_role(ledger_id, 'operator'));

-- ---------------------------------------------------------------------------
-- Admin functions (callable by super_admin / admin; every call is audited).
-- ---------------------------------------------------------------------------
create function public.admin_set_user_status(p_user uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_super_admin() then
    perform public.write_audit(null, 'admin', 'profiles', p_user, 'denied', jsonb_build_object('status', p_status));
    return jsonb_build_object('ok', false, 'error', 'not authorized');
  end if;
  if p_user = auth.uid() and p_status = 'suspended' then
    return jsonb_build_object('ok', false, 'error', 'cannot suspend yourself');
  end if;
  if p_status not in ('active', 'suspended') then
    return jsonb_build_object('ok', false, 'error', 'invalid status');
  end if;
  update public.profiles set status = p_status, updated_at = now() where id = p_user;
  perform public.write_audit(null, 'admin', 'profiles', p_user, 'ok', jsonb_build_object('status', p_status));
  return jsonb_build_object('ok', true);
end $$;

create function public.admin_set_member(p_ledger uuid, p_user uuid, p_role public.app_role) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- admins can manage up to their own rank minus one; only super_admin can grant admin/super_admin.
  if not (public.has_ledger_role(p_ledger, 'super_admin')
          or (public.has_ledger_role(p_ledger, 'admin') and public.role_rank(p_role) < public.role_rank('admin'))) then
    perform public.write_audit(p_ledger, 'admin', 'ledger_members', p_user, 'denied', jsonb_build_object('role', p_role));
    return jsonb_build_object('ok', false, 'error', 'not authorized');
  end if;
  insert into public.ledger_members (ledger_id, user_id, role, created_by) values (p_ledger, p_user, p_role, auth.uid())
  on conflict (ledger_id, user_id) do update set role = excluded.role;
  perform public.write_audit(p_ledger, 'admin', 'ledger_members', p_user, 'ok', jsonb_build_object('role', p_role));
  return jsonb_build_object('ok', true);
end $$;

create function public.admin_remove_member(p_ledger uuid, p_user uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.has_ledger_role(p_ledger, 'super_admin') or p_user = auth.uid() then
    perform public.write_audit(p_ledger, 'admin', 'ledger_members', p_user, 'denied', '{}');
    return jsonb_build_object('ok', false, 'error', 'not authorized');
  end if;
  delete from public.ledger_members where ledger_id = p_ledger and user_id = p_user;
  perform public.write_audit(p_ledger, 'admin', 'ledger_members', p_user, 'ok', '{"removed":true}');
  return jsonb_build_object('ok', true);
end $$;

-- Bootstrap: only the service role (server-side script) can create the first ledger and its owner.
create function public.bootstrap_ledger(p_owner uuid, p_name text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  insert into public.ledgers (name, created_by) values (p_name, p_owner) returning id into v_id;
  insert into public.ledger_members (ledger_id, user_id, role, created_by) values (v_id, p_owner, 'super_admin', p_owner);
  insert into public.ledger_settings (ledger_id, created_by) values (v_id, p_owner);
  insert into public.audit_logs (ledger_id, user_id, action, entity, record_id, origin, details)
  values (v_id, p_owner, 'admin', 'ledgers', v_id, 'system', jsonb_build_object('bootstrap', true));
  return v_id;
end $$;
revoke all on function public.bootstrap_ledger(uuid, text) from public, anon, authenticated;

-- Cairn — private calendar feed (ICS) and change history with previous values.

-- 1) Calendar feed. The app writes the ICS text whenever data change; calendar apps fetch it through
--    /api/calendario/<token>.ics. Only the SHA-256 of the token is stored; rotating the token revokes old links.
create table public.calendar_feeds (
  ledger_id   uuid primary key references public.ledgers (id) on delete cascade,
  token_hash  bytea not null unique check (length(token_hash) = 32),
  ics         text not null default '' check (length(ics) <= 2000000),
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid()
);
alter table public.calendar_feeds enable row level security;
create policy calendar_feeds_select on public.calendar_feeds for select to authenticated using (public.has_ledger_role(ledger_id, 'admin'));
create policy calendar_feeds_insert on public.calendar_feeds for insert to authenticated with check (public.has_ledger_role(ledger_id, 'admin'));
create policy calendar_feeds_update on public.calendar_feeds for update to authenticated
  using (public.has_ledger_role(ledger_id, 'admin')) with check (public.has_ledger_role(ledger_id, 'admin'));
create policy calendar_feeds_delete on public.calendar_feeds for delete to authenticated using (public.has_ledger_role(ledger_id, 'admin'));
revoke all on public.calendar_feeds from anon;
grant select, insert, update, delete on public.calendar_feeds to authenticated;

create function public.calendar_feeds_audit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    perform public.write_audit(old.ledger_id, 'admin', 'calendar_feeds', null, 'ok', '{"event":"feed_disabled"}');
  elsif tg_op = 'INSERT' or new.token_hash is distinct from old.token_hash then
    perform public.write_audit(new.ledger_id, 'admin', 'calendar_feeds', null, 'ok', jsonb_build_object('event', case when tg_op = 'INSERT' then 'feed_created' else 'feed_rotated' end));
  end if;
  return null;
end $$;
create trigger calendar_feeds_audit after insert or update or delete on public.calendar_feeds
  for each row execute function public.calendar_feeds_audit();

-- Public read by token only (no session): returns the ICS text or null. Token format is checked first.
create function public.calendar_ics(p_token text) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select f.ics from public.calendar_feeds f
  where p_token ~ '^[A-Za-z0-9_-]{43}$' and f.token_hash = sha256(convert_to(p_token, 'UTF8'))
$$;
revoke all on function public.calendar_ics(text) from public;
-- @public-grant
grant execute on function public.calendar_ics(text) to anon, authenticated;

-- 2) History: keep the previous version of the record on update/delete, so a change can be undone.
create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_action text; v_details jsonb;
begin
  v_action := case
    when tg_op = 'INSERT' then 'create'
    when new.deleted_at is not null and old.deleted_at is null then 'delete'
    else 'update' end;
  v_details := jsonb_build_object('version', new.version);
  if tg_op = 'UPDATE' then v_details := v_details || jsonb_build_object('before', to_jsonb(old) - 'ledger_id'); end if;
  perform public.write_audit(new.ledger_id, v_action, tg_table_name, new.id, 'ok', v_details);
  return null;
end $$;

-- 3) Private Excel template (Excel v3 export) may be stored in the attachments bucket.
update storage.buckets set allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp','image/heic','text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] where id = 'attachments';

notify pgrst, 'reload schema';

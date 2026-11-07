-- Cairn — explicit privilege hardening on top of Supabase's default grants.
-- The app has no anonymous features: anon gets nothing in the public schema.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from anon;

-- Audit log: readable by admins through RLS, never writable by API roles.
revoke insert, update, delete, truncate on public.audit_logs from authenticated;
-- Sync log rows are created/updated only by apply_operation (which runs as the caller).
revoke delete, truncate on public.sync_operations from authenticated;
-- Membership and ledgers change only through the admin functions.
revoke insert, update, delete, truncate on public.ledger_members from authenticated;
revoke insert, update, delete, truncate on public.ledgers from authenticated;
-- Profiles: only display name and last-seen are self-editable.
revoke insert, delete, truncate on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, last_seen_at) on public.profiles to authenticated;
-- Admin/bootstrap entry points stay closed to API roles except where explicitly granted.
revoke execute on function public.bootstrap_ledger(uuid, text) from authenticated;
revoke execute on function public.write_audit(uuid, text, text, uuid, text, jsonb) from authenticated;

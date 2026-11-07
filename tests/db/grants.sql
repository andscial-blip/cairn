-- Supabase default privileges (RLS still decides row access).
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
-- Re-apply column-level restriction from the core migration after the blanket grant.
revoke update on public.profiles from authenticated;
grant update (display_name, last_seen_at) on public.profiles to authenticated;
-- The audit log is append-only and only writable through SECURITY DEFINER code.
revoke insert, update, delete on public.audit_logs from authenticated;

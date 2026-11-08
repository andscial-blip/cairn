-- Hardening from the Supabase security advisor (8/11/2026).
-- 1. Fixed search_path on the four functions that lacked it.
alter function public.audit_logs_immutable() set search_path = public, pg_temp;
alter function public.role_rank(public.app_role) set search_path = public, pg_temp;
alter function public.storage_ledger(text) set search_path = public, pg_temp;
alter function public.sync_entities() set search_path = public, pg_temp;

-- 2. Trigger functions are never called directly: no EXECUTE for API roles (triggers still fire;
--    PostgreSQL checks EXECUTE only when the trigger is created).
revoke execute on function public.audit_hard_delete() from public, anon, authenticated;
revoke execute on function public.audit_row() from public, anon, authenticated;
revoke execute on function public.audit_logs_immutable() from public, anon, authenticated;
revoke execute on function public.calendar_feeds_audit() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.same_ledger_guard() from public, anon, authenticated;
revoke execute on function public.touch_row() from public, anon, authenticated;

-- 3. Admin and policy helpers: signed-in users only (every RLS policy is TO authenticated).
--    calendar_ics and einvoice_inbox_put stay callable by anon on purpose: they are gated by a secret token.
revoke execute on function public.admin_remove_member(uuid, uuid) from public, anon;
revoke execute on function public.admin_set_member(uuid, uuid, public.app_role) from public, anon;
revoke execute on function public.admin_set_user_status(uuid, text) from public, anon;
revoke execute on function public.has_ledger_role(uuid, public.app_role) from public, anon;
revoke execute on function public.is_active_user() from public, anon;
revoke execute on function public.is_super_admin() from public, anon;
revoke execute on function public.role_rank(public.app_role) from public, anon;
revoke execute on function public.storage_ledger(text) from public, anon;
revoke execute on function public.sync_entities() from public, anon;
grant execute on function public.has_ledger_role(uuid, public.app_role), public.is_active_user(), public.is_super_admin(),
  public.role_rank(public.app_role), public.storage_ledger(text), public.sync_entities() to authenticated;

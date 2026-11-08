-- The previous migration removed EXECUTE from PUBLIC: signed-in users keep the admin functions through an explicit
-- grant (already present on the hosted project, needed on a fresh database). The functions check the caller's role.
grant execute on function public.admin_remove_member(uuid, uuid), public.admin_set_member(uuid, uuid, public.app_role),
  public.admin_set_user_status(uuid, text) to authenticated;

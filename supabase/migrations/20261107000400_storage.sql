-- Cairn — private Storage bucket for attachments.
-- Object paths are "<ledger_id>/<attachment_id>/<filename>": the first folder decides access.
-- The bucket is not public; the app reads files through short-lived signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 15728640,
        array['application/pdf','image/jpeg','image/png','image/webp','image/heic','text/csv'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create function public.storage_ledger(p_name text) returns uuid
language plpgsql immutable as $$
begin
  return (storage.foldername(p_name))[1]::uuid;
exception when others then
  return null;
end $$;

create policy attachments_obj_select on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and public.has_ledger_role(public.storage_ledger(name), 'read_only'));
create policy attachments_obj_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and public.has_ledger_role(public.storage_ledger(name), 'operator'));
create policy attachments_obj_update on storage.objects for update to authenticated
  using (bucket_id = 'attachments' and public.has_ledger_role(public.storage_ledger(name), 'operator'));
create policy attachments_obj_delete on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and public.has_ledger_role(public.storage_ledger(name), 'admin'));

-- Cairn — inbox for the e-invoice files that arrive by email (courtesy PDF, XML or P7M from the accountant).
-- A small Google Apps Script in the owner's Gmail posts each attachment with a private token; only the SHA-256 of the
-- token is stored. The app reads the inbox when it opens, matches each file to its invoice, attaches it through the
-- normal upload path and clears the file content from here.

create table public.einvoice_inbox_tokens (
  ledger_id   uuid primary key references public.ledgers (id) on delete cascade,
  token_hash  bytea not null unique check (length(token_hash) = 32),
  created_at  timestamptz not null default now(),
  created_by  uuid default auth.uid(),
  last_used_at timestamptz
);
alter table public.einvoice_inbox_tokens enable row level security;
create policy einvoice_inbox_tokens_select on public.einvoice_inbox_tokens for select to authenticated using (public.has_ledger_role(ledger_id, 'admin'));
create policy einvoice_inbox_tokens_write on public.einvoice_inbox_tokens for all to authenticated
  using (public.has_ledger_role(ledger_id, 'admin')) with check (public.has_ledger_role(ledger_id, 'admin'));
revoke all on public.einvoice_inbox_tokens from anon;
grant select, insert, update, delete on public.einvoice_inbox_tokens to authenticated;

create table public.einvoice_inbox (
  id           uuid primary key default gen_random_uuid(),
  ledger_id    uuid not null references public.ledgers (id) on delete cascade,
  received_at  timestamptz,
  created_at   timestamptz not null default now(),
  filename     text not null check (length(filename) between 1 and 200),
  mime         text not null check (mime in ('application/pdf', 'application/xml', 'application/pkcs7-mime')),
  size         int not null check (size > 0 and size <= 5000000),
  sha256       bytea not null check (length(sha256) = 32),
  content_b64  text,                                   -- cleared once the file is attached to its invoice
  status       text not null default 'new' check (status in ('new', 'attached', 'ignored')),
  invoice_id   uuid,
  note         text not null default '' check (length(note) <= 300),
  updated_at   timestamptz not null default now(),
  unique (ledger_id, sha256)
);
create index einvoice_inbox_new_idx on public.einvoice_inbox (ledger_id, status, created_at);
alter table public.einvoice_inbox enable row level security;
create policy einvoice_inbox_select on public.einvoice_inbox for select to authenticated using (public.has_ledger_role(ledger_id, 'operator'));
create policy einvoice_inbox_update on public.einvoice_inbox for update to authenticated
  using (public.has_ledger_role(ledger_id, 'operator')) with check (public.has_ledger_role(ledger_id, 'operator'));
revoke all on public.einvoice_inbox from anon;
grant select, update on public.einvoice_inbox to authenticated;

-- Public entry point (no session): token checked by hash, file type and size checked, duplicates ignored,
-- at most 60 files per hour per ledger. Returns 'ok', 'duplicate' or raises.
create function public.einvoice_inbox_put(p_token text, p_filename text, p_mime text, p_b64 text, p_received timestamptz default null)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ledger uuid; v_bytes bytea; v_mime text; v_name text; v_id uuid;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then raise exception 'invalid token' using errcode = '28000'; end if;
  select ledger_id into v_ledger from public.einvoice_inbox_tokens where token_hash = sha256(convert_to(p_token, 'UTF8'));
  if v_ledger is null then raise exception 'invalid token' using errcode = '28000'; end if;
  if length(coalesce(p_b64, '')) = 0 or length(p_b64) > 6700000 then raise exception 'file too large or empty' using errcode = '22023'; end if;
  v_name := left(regexp_replace(coalesce(p_filename, 'fattura'), '[^A-Za-z0-9._ -]+', '_', 'g'), 200);
  v_mime := case
    when v_name ~* '\.pdf$' then 'application/pdf'
    when v_name ~* '\.xml$' then 'application/xml'
    when v_name ~* '\.p7m$' then 'application/pkcs7-mime'
    else null end;
  if v_mime is null then raise exception 'unsupported file type' using errcode = '22023'; end if;
  v_bytes := decode(p_b64, 'base64');
  if (select count(*) from public.einvoice_inbox where ledger_id = v_ledger and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'too many files' using errcode = '54000'; end if;
  insert into public.einvoice_inbox (ledger_id, received_at, filename, mime, size, sha256, content_b64)
  values (v_ledger, p_received, v_name, v_mime, length(v_bytes), sha256(v_bytes), p_b64)
  on conflict (ledger_id, sha256) do nothing returning id into v_id;
  update public.einvoice_inbox_tokens set last_used_at = now() where ledger_id = v_ledger;
  return case when v_id is null then 'duplicate' else 'ok' end;
end $$;
revoke all on function public.einvoice_inbox_put(text, text, text, text, timestamptz) from public;
-- @public-grant
grant execute on function public.einvoice_inbox_put(text, text, text, text, timestamptz) to anon, authenticated;
notify pgrst, 'reload schema';

-- Cairn — domain tables. Every syncable table shares the same bookkeeping columns:
--   id (client-generated UUID), ledger_id, version (optimistic concurrency), created/updated
--   timestamps and authors, deleted_at (soft delete so deletions propagate to offline devices).

create table public.clients (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  name text not null check (length(name) between 1 and 200),
  short_code text,
  vat_id text,
  country text not null default 'IT',
  is_foreign boolean not null default false,
  payment_terms jsonb not null default '{}'::jsonb,   -- {"dayOfMonth":5} | {"endOfMonth":true,"days":30}
  notes text not null default ''
);

create table public.contracts (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  title text not null,
  start_date date not null,
  end_date date,
  monthly_fee numeric(12,2) not null default 0 check (monthly_fee >= 0),
  is_signed boolean not null default true,              -- false = hypothesis (renewal not yet signed)
  terms jsonb not null default '{}'::jsonb,             -- billing cadence, allowances, quotas
  notes text not null default '',
  check (end_date is null or end_date >= start_date)
);

create table public.missions (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete set null,
  start_date date not null,
  end_date date not null,
  country text not null default 'MG',
  daily_allowance numeric(10,2) not null default 0 check (daily_allowance >= 0),
  notes text not null default '',
  check (end_date >= start_date)
);

create table public.invoices (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  year int not null check (year between 2000 and 2100),
  number int not null check (number > 0),
  issue_date date not null,
  collected_on date,
  sdi_sent_on date,
  sent_to_accountant_on date,
  sdi_number text,
  stamp_duty numeric(6,2) not null default 0 check (stamp_duty >= 0),
  stamp_auto boolean not null default true,
  months_covered text[] not null default '{}',
  travel jsonb,                                         -- {"from":"2026-10-15","to":"2026-10-31","rate":40}
  attachment_id uuid references public.attachments (id) on delete set null,
  notes text not null default '',
  check (collected_on is null or collected_on >= issue_date - 365)
);

create table public.invoice_lines (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  position int not null default 0,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  kind text not null default 'compenso' check (kind in ('compenso','trasferta','rimborso','altro'))
);

create table public.f24_payments (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  due_date date not null,
  paid_on date,
  amount numeric(12,2) not null check (amount >= 0),
  description text not null default '',
  kind text not null default 'altro',                   -- saldo, acconto1, acconto2, inps, ravvedimento, altro
  codes jsonb not null default '[]'::jsonb,
  attachment_id uuid references public.attachments (id) on delete set null,
  notes text not null default ''
);

create table public.reminders (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  key text,
  due_date date not null,
  title text not null,
  notes text not null default '',
  done_on date
);

create table public.tax_returns (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  year int not null,
  kind text not null,                                   -- redditi, cu, 730, ...
  filed_on date,
  data jsonb not null default '{}'::jsonb,
  attachment_id uuid references public.attachments (id) on delete set null
);

create table public.monthly_expenses (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  categories jsonb not null default '{}'::jsonb,        -- {"casa": 812.4, ...} totals only, no transactions
  invested numeric(12,2) not null default 0,
  sources text[] not null default '{}',
  notes text not null default ''
);

create table public.savings_accounts (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  name text not null, product text not null default '', logo text,
  role text not null default 'savings' check (role in ('savings','tax')),
  balance numeric(12,2) not null default 0, gains numeric(12,2) not null default 0, as_of date not null,
  gross_rate numeric(6,3) not null default 0, cost_rate numeric(6,3) not null default 0,
  stamp_rate numeric(6,3) not null default 0, tax_rate numeric(5,2) not null default 26,
  contribution jsonb not null default '{}'::jsonb,      -- {"amount":35,"day":25,"note":"arrotondamenti"}
  covers_from date,
  sort int not null default 0,
  notes jsonb not null default '[]'::jsonb
);

create table public.investment_accounts (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  name text not null, logo text, as_of date not null,
  deposits numeric(12,2) not null default 0, withdrawals numeric(12,2) not null default 0,
  deposit_fees numeric(12,2) not null default 0, fx_fees numeric(12,2) not null default 0,
  realized jsonb not null default '[]'::jsonb, monthly jsonb not null default '{}'::jsonb,
  pac jsonb not null default '{}'::jsonb                -- amount, day, start, years, reviewMonths, threshold, lastReview
);

create table public.holdings (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  account_id uuid not null references public.investment_accounts (id) on delete cascade,
  isin text not null check (isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
  ticker text not null, name text not null, asset_class text not null default '',
  units numeric(18,6) not null default 0, cost numeric(12,2) not null default 0,
  price_eur numeric(14,4) not null default 0, currency text not null default 'EUR',
  target_pct numeric(5,2) not null default 0 check (target_pct between 0 and 100)
);

-- ---------------------------------------------------------------------------
-- Shared columns, triggers, indexes and RLS for every syncable table.
-- ---------------------------------------------------------------------------
create function public.touch_row() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
    new.created_at := now();
    new.created_by := coalesce(new.created_by, auth.uid());
  else
    -- Optimistic concurrency: a writer must send exactly current version + 1.
    if new.version is distinct from old.version + 1 then
      raise exception 'version_conflict: expected %, got %', old.version + 1, new.version
        using errcode = '40001', detail = json_build_object('current', old.version)::text;
    end if;
    if new.ledger_id <> old.ledger_id or new.id <> old.id then
      raise exception 'immutable key' using errcode = '42501';
    end if;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
  end if;
  new.updated_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end $$;

create function public.audit_row() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_action text;
begin
  v_action := case
    when tg_op = 'INSERT' then 'create'
    when new.deleted_at is not null and old.deleted_at is null then 'delete'
    else 'update' end;
  perform public.write_audit(new.ledger_id, v_action, tg_table_name, new.id, 'ok',
                             jsonb_build_object('version', new.version));
  return null;
end $$;

-- Hard deletes are reserved to admins; normal deletion is a soft delete (deleted_at).
create function public.audit_hard_delete() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.write_audit(old.ledger_id, 'delete', tg_table_name, old.id, 'ok', '{"hard":true}');
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['clients','contracts','missions','invoices','invoice_lines','f24_payments','reminders',
                           'tax_returns','monthly_expenses','savings_accounts','investment_accounts','holdings'] loop
    execute format($f$
      alter table public.%1$I
        add column version    int not null default 1,
        add column created_at timestamptz not null default now(),
        add column updated_at timestamptz not null default now(),
        add column created_by uuid,
        add column updated_by uuid,
        add column deleted_at timestamptz;
      create index %1$s_sync_idx on public.%1$I (ledger_id, updated_at);
      create trigger %1$s_touch before insert or update on public.%1$I for each row execute function public.touch_row();
      create trigger %1$s_audit after insert or update on public.%1$I for each row execute function public.audit_row();
      create trigger %1$s_audit_del after delete on public.%1$I for each row execute function public.audit_hard_delete();
      alter table public.%1$I enable row level security;
      create policy %1$s_select on public.%1$I for select to authenticated using (public.has_ledger_role(ledger_id, 'read_only'));
      create policy %1$s_insert on public.%1$I for insert to authenticated with check (public.has_ledger_role(ledger_id, 'operator'));
      create policy %1$s_update on public.%1$I for update to authenticated
        using (public.has_ledger_role(ledger_id, 'operator')) with check (public.has_ledger_role(ledger_id, 'operator'));
      create policy %1$s_delete on public.%1$I for delete to authenticated using (public.has_ledger_role(ledger_id, 'admin'));
    $f$, t);
  end loop;
end $$;

-- Partial unique indexes (need deleted_at, added above).
create unique index invoices_number_uq on public.invoices (ledger_id, year, number) where deleted_at is null;
create unique index reminders_key_uq on public.reminders (ledger_id, key) where key is not null and deleted_at is null;
create unique index monthly_expenses_month_uq on public.monthly_expenses (ledger_id, month) where deleted_at is null;
create unique index holdings_isin_uq on public.holdings (account_id, isin) where deleted_at is null;

-- The same version/updated_at bookkeeping for the core syncable tables.
create trigger attachments_touch before insert or update on public.attachments for each row execute function public.touch_row();
create trigger attachments_audit after insert or update on public.attachments for each row execute function public.audit_row();
create trigger ledger_settings_touch before insert or update on public.ledger_settings for each row execute function public.touch_row();
create trigger ledger_settings_audit after insert or update on public.ledger_settings for each row execute function public.audit_row();

-- Cross-ledger reference guard: child rows must belong to the same ledger as their parent.
create function public.same_ledger_guard() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_parent_ledger uuid; v_col text := tg_argv[0]; v_table text := tg_argv[1]; v_ref uuid;
begin
  execute format('select ($1).%I', v_col) using new into v_ref;
  if v_ref is null then return new; end if;
  execute format('select ledger_id from public.%I where id = $1', v_table) using v_ref into v_parent_ledger;
  if v_parent_ledger is distinct from new.ledger_id then
    raise exception 'cross-ledger reference on %.%', tg_table_name, v_col using errcode = '42501';
  end if;
  return new;
end $$;
create trigger contracts_client_guard before insert or update on public.contracts for each row execute function public.same_ledger_guard('client_id','clients');
create trigger invoices_client_guard before insert or update on public.invoices for each row execute function public.same_ledger_guard('client_id','clients');
create trigger invoice_lines_inv_guard before insert or update on public.invoice_lines for each row execute function public.same_ledger_guard('invoice_id','invoices');
create trigger missions_contract_guard before insert or update on public.missions for each row execute function public.same_ledger_guard('contract_id','contracts');
create trigger holdings_account_guard before insert or update on public.holdings for each row execute function public.same_ledger_guard('account_id','investment_accounts');

-- Cairn — fits the domain tables to everything the original app stores, so the import is lossless.

-- Clients: invoice header data, default fee/allowance and line templates.
alter table public.clients
  add column legal_name text not null default '',
  add column address text not null default '',
  add column pec text not null default '',
  add column sort int not null default 0,
  add column payment_days int check (payment_days is null or payment_days between 0 and 365),
  add column default_fee numeric(12,2) not null default 0,
  add column default_rate numeric(10,2) not null default 0,
  add column templates jsonb not null default '{}'::jsonb;      -- {"line": "...{MESE}", "travel": "...{DAL}…{AL}"}

-- Contracts: is_active flag; billing rules live in terms {amount, every, offset, rule, rate}.
alter table public.contracts add column is_active boolean not null default true;

-- Missions: either a dated trip, or an annual quota of days without dates.
alter table public.missions
  add column client_id uuid references public.clients (id) on delete cascade,
  add column kind text not null default 'trip' check (kind in ('trip', 'quota')),
  add column year int check (year is null or year between 2000 and 2100),
  add column days int check (days is null or days >= 0),
  add column is_hypothesis boolean not null default false,
  alter column start_date drop not null,
  alter column end_date drop not null,
  drop constraint missions_check,
  add constraint missions_shape check (
    (kind = 'trip' and start_date is not null and end_date is not null and end_date >= start_date)
    or (kind = 'quota' and year is not null and days is not null));
create trigger missions_client_guard before insert or update on public.missions
  for each row execute function public.same_ledger_guard('client_id', 'clients');

-- Invoices: SdI tracking switch and the printed number label.
alter table public.invoices
  add column status_tracking boolean not null default false,
  add column number_label text not null default '';

-- Reminders: lead time and optional client.
alter table public.reminders
  add column lead_days int not null default 14 check (lead_days between 0 and 365),
  add column client_id uuid references public.clients (id) on delete set null;
create trigger reminders_client_guard before insert or update on public.reminders
  for each row execute function public.same_ledger_guard('client_id', 'clients');

-- Savings: underlying fund name (e.g. money-market fund behind a "salvadanaio").
alter table public.savings_accounts add column fund text not null default '';

-- Other income outside the VAT number (director fees, employment), needed for the 30k exclusion check.
create table public.other_income (
  id uuid primary key, ledger_id uuid not null references public.ledgers (id) on delete cascade,
  received_on date not null,
  kind text not null,                                   -- amministratore, dipendente, altro
  amount numeric(12,2) not null check (amount >= 0),
  notes text not null default ''
);

do $$
begin
  execute $f$
    alter table public.other_income
      add column version int not null default 1, add column created_at timestamptz not null default now(),
      add column updated_at timestamptz not null default now(), add column created_by uuid, add column updated_by uuid,
      add column deleted_at timestamptz;
    create index other_income_sync_idx on public.other_income (ledger_id, updated_at);
    create trigger other_income_touch before insert or update on public.other_income for each row execute function public.touch_row();
    create trigger other_income_audit after insert or update on public.other_income for each row execute function public.audit_row();
    create trigger other_income_audit_del after delete on public.other_income for each row execute function public.audit_hard_delete();
    alter table public.other_income enable row level security;
    create policy other_income_select on public.other_income for select to authenticated using (public.has_ledger_role(ledger_id, 'read_only'));
    create policy other_income_insert on public.other_income for insert to authenticated with check (public.has_ledger_role(ledger_id, 'operator'));
    create policy other_income_update on public.other_income for update to authenticated
      using (public.has_ledger_role(ledger_id, 'operator')) with check (public.has_ledger_role(ledger_id, 'operator'));
    create policy other_income_delete on public.other_income for delete to authenticated using (public.has_ledger_role(ledger_id, 'admin'));
  $f$;
end $$;
revoke all on public.other_income from anon;
grant select, insert, update, delete on public.other_income to authenticated;

-- Sync whitelist now includes other_income.
create or replace function public.sync_entities() returns text[]
language sql immutable as $$
  select array['clients','contracts','missions','invoices','invoice_lines','f24_payments','reminders','tax_returns',
               'monthly_expenses','savings_accounts','investment_accounts','holdings','attachments','ledger_settings','other_income']
$$;

-- Cairn — monthly expenses kept per source (UniCredit, Revolut…), so importing one bank's statement updates only its part.
-- Totals only, never single transactions.
alter table public.monthly_expenses add column if not exists by_source jsonb not null default '{}'::jsonb;
notify pgrst, 'reload schema';

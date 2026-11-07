-- Cairn — daily snapshots of the investment account (value, cost basis, uninvested cash), written by the Trading 212 sync.
alter table public.investment_accounts add column if not exists history jsonb not null default '[]'::jsonb;
notify pgrst, 'reload schema';

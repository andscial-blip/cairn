-- Cairn — one point per balance update of a savings account ({d, saldo, guadagno}): effective yield and trend.
alter table public.savings_accounts add column if not exists history jsonb not null default '[]'::jsonb;
notify pgrst, 'reload schema';

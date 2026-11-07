-- Cairn — data read from the Trading 212 history (permission "History"), written by the sync:
-- income = interest and dividends; tax_years = per-year tax figures (RM/RT, RW, IVAFE) computed at sync time;
-- history_on = day of the last complete history import (when monthly deposits, fees and realised P/L are real, not estimated).
alter table public.investment_accounts
  add column if not exists income jsonb not null default '[]'::jsonb,
  add column if not exists tax_years jsonb not null default '[]'::jsonb,
  add column if not exists history_on date;
notify pgrst, 'reload schema';

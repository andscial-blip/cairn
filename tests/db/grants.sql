-- Emulates Supabase's default privileges BEFORE the migrations' own revokes are re-applied,
-- so tests see the same effective grants as the hosted project.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

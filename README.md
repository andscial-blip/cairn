# Cassa e Fisco

PWA personale per P.IVA forfettaria: fatture, F24, entrate, spese, risparmi e investimenti.
Next.js + TypeScript · Supabase (Postgres, Auth, RLS, Storage) · IndexedDB/Dexie offline-first · Vercel.

## Avvio locale
```bash
npm ci
cp .env.example .env.local   # inserisci URL e anon key del progetto Supabase
npm run dev
```

## Test
```bash
npm test            # unit: motore di sync, coda offline, sessione
npm run test:db     # integrazione su Postgres reale (TEST_DATABASE_URL), RLS e sync
npm run typecheck
```

## Database
Le migration sono in `supabase/migrations/` e si applicano in ordine (Supabase CLI: `supabase db push`).
Primo utente e fascicolo: `scripts/bootstrap-owner.mjs` (solo lato server, con service role key).

Documentazione: `docs/01-analisi.md`, `docs/02-architettura.md`, `docs/STATO.md`.

# Fase B — Architettura

## Decisioni
| Tema | Decisione | Motivo |
|---|---|---|
| Utenti | Un solo utente reale (proprietario, `super_admin`). Nessuna registrazione pubblica: l'account si crea con `scripts/bootstrap-owner.mjs` (invito email). | Uso personale; il modello a fascicolo e i 5 ruoli restano pronti se in futuro serve dare accesso (es. commercialista in sola lettura). |
| Ruoli | `read_only < operator < responsabile < admin < super_admin`, per fascicolo (`ledger_members`). Applicati nel DB con RLS e nelle funzioni admin. | La sicurezza non dipende dall'interfaccia. |
| Calendario | Feed ICS privato con token (Fase D) al posto dell'MCP Google. | Nessun OAuth, nessun pulsante "sincronizza": Google Calendar si iscrive al feed. |
| Scritture | Tutte via RPC `apply_operation` (online e offline). | Un solo percorso: idempotenza, versioni, audit uniformi. |
| Conflitti | Versione intera per riga; mismatch → stato `conflict` con copia server, risoluzione esplicita. Mai last-write-wins. | Requisito 7.4. |
| Cancellazioni | Soft delete (`deleted_at`) versionato; hard delete solo admin. | Propagazione ai dispositivi offline. |
| Allegati | Bucket privato `attachments`, percorso `<ledger>/<id>/<file>`, URL firmati, max 15 MB, MIME in whitelist. | Requisito 8. |

## Schema
Comuni: `profiles`, `ledgers`, `ledger_members`, `audit_logs` (append-only, trigger anti-modifica), `sync_operations` (chiave di idempotenza = `op_id` generato sul dispositivo), `attachments`, `ledger_settings`.
Dominio: `clients`, `contracts`, `missions`, `invoices` (+ `invoice_lines`), `f24_payments`, `reminders`, `tax_returns`, `monthly_expenses`, `savings_accounts`, `investment_accounts`, `holdings`.
Ogni tabella sincronizzabile: `id uuid` (dal client), `ledger_id`, `version`, `created_at/updated_at/created_by/updated_by`, `deleted_at`, indice `(ledger_id, updated_at)`, trigger `touch_row` (versione +1 obbligatoria), trigger di audit, guardia anti riferimenti tra fascicoli diversi.
Migration versionate in `supabase/migrations/`.

## Sincronizzazione
- **Push**: coda `outbox` in IndexedDB, FIFO stretta; stati `pending → syncing → synced | failed | conflict`; backoff esponenziale con jitter (2 s → 15 min); un crash durante l'invio è recuperato rimettendo `syncing` in `pending` (sicuro grazie all'idempotenza).
- **Pull**: per tabella, `updated_at >= cursore − 2 min` (sovrapposizione contro commit fuori ordine); non sovrascrive mai record con modifiche locali non confermate.
- **Trigger**: apertura app, ritorno online, ritorno in primo piano, dopo ogni salvataggio, manuale, timer di sicurezza 60 s. Non dipende dalla Background Sync API.
- **Sessione offline**: richiede un primo login online; poi concessione locale di 7 giorni (`NEXT_PUBLIC_OFFLINE_SESSION_HOURS`), legata a utente e dispositivo, senza password né segreti salvati. Alla scadenza: sola lettura finché non si rientra online. Un account sospeso perde l'accesso al primo contatto col server e le sue operazioni in coda vengono rifiutate e registrate.

## Sicurezza
RLS su tutte le tabelle esposte; funzioni `SECURITY DEFINER` con `search_path` fissato; nessuna chiave `service_role` nel frontend (solo script server); CSP restrittiva, HSTS, `frame-ancestors 'none'`; tentativi negati registrati nell'audit senza annullamento della transazione.

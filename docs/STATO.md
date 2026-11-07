# Stato del progetto e criteri di accettazione

Legenda: ✅ verificato con test automatico · 🟡 implementato, verifica pendente · ⬜ da fare · 👤 richiede un'azione del proprietario

| Criterio | Stato | Prova |
|---|---|---|
| Dati salvati in PostgreSQL | ✅ | `tests/db/security-sync.test.ts` su Postgres 16 |
| Autorizzazioni applicate nel database (RLS) | ✅ | test: estraneo, anonimo, sola lettura, isolamento fascicoli, storage |
| Escalation di privilegi bloccata e registrata | ✅ | test "privilege escalation" |
| Account sospeso senza accesso, sync rifiutata | ✅ | test "suspended accounts" |
| Sincronizzazione senza duplicati | ✅ | test DB "replaying the same op_id" + unit "lost response" |
| Conflitti rilevati e gestiti | ✅ | test DB "concurrent edits" + unit "conflict kept… resolution is explicit" |
| Coda offline sopravvive alla chiusura | ✅ | unit "queue survives closing and reopening" (IndexedDB) |
| Recupero da sync interrotta | ✅ | unit "interrupted sync" |
| Log di audit funzionanti e non modificabili | ✅ | test "audit log cannot be altered", "audit entries carry…" |
| Login funzionante | ✅ | verificato dal proprietario su https://cairn-three-pi.vercel.app (7/11/2026); e2e automatico in Fase E |
| Amministratore gestisce gli account | 🟡 | funzioni `admin_*` testate; interfaccia admin in Fase D |
| Funzioni offline previste operative nell'interfaccia | ⬜ | Fase D |
| Allegati trasferiti correttamente | ⬜ | Fase D (policy storage già testate) |
| Backup configurati e verificati | ⬜ | Fase F 👤 (piano Supabase) |
| Email di autenticazione affidabili | ⬜ | SMTP dedicato (es. Resend) in Fase F: l'SMTP integrato di Supabase ha limiti orari molto bassi |
| App online | ✅ | Vercel (dub1) + Supabase eu-west-1, deploy automatico da `main` |
| App utilizzabile da PC e smartphone | ⬜ | Fase E; test su iPhone/Android reali 👤 |
| Documentazione aggiornata | 🟡 | `docs/` |

## Migrazioni applicate in produzione (SQL Editor)
| Migrazione | File consegnato | Stato |
|---|---|---|
| 0100–0500 | cairn-1-setup.sql | ✅ applicata |
| 0600 domain_fit | cairn-3-aggiornamento.sql | ✅ applicata 07/11/2026 |
| 0700 calendar_history | cairn-4-aggiornamento.sql | ✅ applicata 07/11/2026 |

Regola: ogni nuova migrazione → nuovo file numerato da incollare nel SQL Editor + `notify pgrst, 'reload schema'`.

## Fase D — stato al 07/11/2026
| Area | Stato | Verifica |
|---|---|---|
| 12 sezioni (lettura, grafici, tooltip, filtri) | ✅ | 16 viste × 4 date identiche all'originale (64 test golden) |
| Modifiche (fatture, contratti, missioni, F24, promemoria, risparmi, investimenti, impostazioni) | ✅ codice originale + bridge sulla coda offline | 10 test bridge, round-trip lossless su dati reali (13 test), e2e browser offline→online |
| PDF fatture | ✅ upload su Storage privato, apertura con URL firmato a 2 min | e2e |
| Navigazione offline in tutte le sezioni | ✅ service worker v2 con precache | e2e |
| Calendario | ✅ feed ICS privato (token 256 bit, salvato solo come hash, ruotabile), ripubblicato a ogni modifica | test DB, test route, e2e |
| Export Excel v3 / Excel dati / PDF proforma / PDF dossier | ✅ modello v3 nello Storage privato; librerie servite da Cairn (CSP 'self', offline) | e2e: 4 download |
| Cronologia e ripristino | ✅ audit_logs con valore precedente; un record eliminato torna come nuovo record | test DB, e2e |

## Rischi accettati (da rivedere)
- `xlsx@0.18.5` e `dompurify` (via `jspdf@2.5.1`) segnalati da npm audit: le vulnerabilità riguardano la lettura di file/HTML non fidati; Cairn li usa solo per scrivere file dai propri dati. Piano: SheetJS 0.20.x (dal loro CDN, dominio da abilitare) e jspdf 3.x con test di non regressione degli export.
- Google Calendar ignora gli avvisi (VALARM) dei calendari sottoscritti: notifiche da impostare sul calendario.

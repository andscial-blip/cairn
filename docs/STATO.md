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
| Login funzionante | 🟡 | pagina `/login` pronta; test end-to-end dopo creazione progetto Supabase 👤 |
| Amministratore gestisce gli account | 🟡 | funzioni `admin_*` testate; interfaccia admin in Fase D |
| Funzioni offline previste operative nell'interfaccia | ⬜ | Fase D |
| Allegati trasferiti correttamente | ⬜ | Fase D (policy storage già testate) |
| Backup configurati e verificati | ⬜ | Fase F 👤 (piano Supabase) |
| App utilizzabile da PC e smartphone | ⬜ | Fase E; test su iPhone/Android reali 👤 |
| Documentazione aggiornata | 🟡 | `docs/` |

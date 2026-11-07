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

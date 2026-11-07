# Fase A — Analisi dell'artefatto esistente

Riferimento: artefatto Claude "Cassa e Fisco A. Scialabba", versione 34 (7 novembre 2026). Dal 7 novembre 2026 l'app si chiama **Cairn** (scelta da un panel di naming: il cairn si costruisce pietra su pietra e indica la strada, come PAC, accantonamenti e patrimonio).

## Architettura esistente
- Un unico file HTML (~400 KB, ~2.400 righe), JavaScript senza framework, ~140 funzioni; viste generate come stringhe HTML.
- Persistenza: database documentale del runtime Claude (13 collezioni: invoices, clients, contratti, missioni, f24, promemoria, config, calsync, spese, redditi, risparmi, investimenti, storico).
- Capability del runtime Claude: `db`, `user`, `assets` (PDF fatture), `downloads` (backup), `mcp` (Google Calendar).
- `localStorage` solo per preferenze (vista, anno, data ultimo backup).

## Funzionalità recuperabili
| Area | Stato | Riuso |
|---|---|---|
| Motore fiscale forfettario (coefficiente 67%, imposta 5%/15%, INPS GS 26,07%, acconti storico/previsionale, F24, ravvedimento, soglie 85k/100k, bollo, SdI 12 gg) | Verificato contro Redditi 2026 | Porting 1:1 in TypeScript + test |
| Previsioni da contratti, simulatore, flusso di cassa 12 mesi | Funzionante | Porting |
| Spese, risparmi, investimenti (PAC, allocazione, proiezioni) | Funzionante | Porting |
| Grafica (palette, logo, IBM Plex, schede, mini grafici, tooltip, tema scuro, mobile) | Approvata | Mantenuta: `globals.css` copiato 1:1 |
| Dati reali | In uso | Import una tantum (non nei test) |

## Problemi individuati
1. Dipendenza totale dal runtime Claude (dati, utente, file, calendario) — bloccante.
2. File unico con viste a stringhe: difficile da mantenere e testare.
3. Nessun test automatico della logica.
4. Nessuna modalità offline.
5. Nessuno schema dati vincolante (date e importi non validati dal database).
6. Ampio uso di HTML dinamico: escaping presente ma non sistematico (rischio XSS).
7. Calendario via MCP disponibile solo dentro Claude.
8. Storico modifiche alterabile, senza distinzione online/offline.

## Interventi
Vedi `02-architettura.md`. In sintesi: Next.js + TypeScript, Supabase (Postgres, Auth, RLS, Storage), Dexie + Service Worker, Vercel, GitHub Actions.

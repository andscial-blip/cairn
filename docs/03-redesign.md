# Cairn v2 — redesign (novembre 2026)

## 1. Audit (prima del redesign)
| Area | Problema rilevato | Evidenza |
|---|---|---|
| Tipografia | Il font IBM Plex non era caricato: ogni sistema mostrava un font diverso | CSS senza @font-face |
| Navigazione | 12 schede; a 1440 px l'ultima tagliata; su telefono 8 voci in "Altro" | screenshot desktop/phone |
| Ridondanza | "Prossimo F24" in 5 punti, soglia 85k in 4, accantonamento in 3 | Dashboard, Analisi, Tasse, Scadenze |
| Lunghezza (telefono) | Analisi 7.742 px (18 pannelli), Tasse 5.129 px, Da emettere 5.255 px (48 righe, 2 anni) | metriche Playwright |
| Tocco | 48 pulsanti < 32 px in Da emettere, 52 in Tasse | metriche Playwright |
| Colore | Riquadri rosa "allarme", oro/verde/blu senza significato fisso, testo grigio 3,1:1 | axe-core: 309 nodi sotto AA |
| Grafici | Colori fissi nel codice (non seguivano tema e palette), testi 9 px | 65 colori hex nelle viste |
| Telefono | Colonna "Totale" fuori schermo in Da emettere; ordine Dashboard: cose da fare in fondo | screenshot |

## 2. Decisioni
- **Architettura dell'informazione**: 7 sezioni (Panoramica, Fatture, Fisco, Finanze, Analisi, Contratti, Impostazioni) con sotto-viste; rotte invariate (link e calendario continuano a funzionare).
- **Layout**: desktop con menu laterale (236 px) e intestazione di pagina con sotto-schede; tablet con barra di icone; telefono con barra in alto e barra in basso (Panoramica, Fatture, +, Fisco, Altro).
- **Contenuti**: Analisi in 5 schede interne; Tasse e F24 in 3; Da emettere mostra 6 mesi; versamenti degli anni passati richiudibili; su telefono "Da fare ora" per primo; descrizioni lunghe limitate a 4 righe; rimosso l'export di migrazione.
- **Brand**: logo "Strati" (vetta gialla, strato verde acqua, base blu notte), scritta CAIRN spaziata, frase "Know where you stand". Fonte unica: `src/lib/brand.ts`; icone generate da `scripts/icons.mjs`.
- **Avvio**: schermata bianca dipinta col primo byte, rimossa appena l'app è pronta (o al primo sync su un dispositivo nuovo); nessun ritardo artificiale.
- **Sblocco biometrico**: WebAuthn con autenticatore di piattaforma (Face ID, Touch ID, impronta, Windows Hello). Verifica locale di firma, challenge, origine, RP e flag UV. Si blocca all'apertura e dopo 5 minuti in background; password sempre disponibile; "Esci da tutti i dispositivi".

## 3. Design system
| Token | Valore (chiaro) | Uso |
|---|---|---|
| `--slate` | #2E3D52 | brand, menu, pulsante primario |
| `--green` / `--green-soft` | #23735F / #5FB8A3 | positivo (testo / grafici) |
| `--red` / `--pink` | #B23B32 / #FBE9E6 | allerta |
| `--lilac` / `--lilac-ink` | #8C80D3 / #5A4EA6 | previsioni, ipotesi |
| `--amber-soft` | #E8BE5A | attenzione, indicatore attivo |
| `--muted` / `--faint` | #556275 / #647182 | testo secondario (≥ 4,5:1) |
| Font | IBM Plex Sans (testo, numeri tabellari), Plex Sans Condensed (titoli) | self-hosted |
| Raggi | 8 / 10 / 14 px | controlli / card / pannelli |
| Spaziatura | scala 4 px (4–32) | |
| Target tocco | ≥ 44 px su telefono | |

## 4. Verifica
| Controllo | Esito |
|---|---|
| Numeri invariati: ogni importo e % delle 16 viste presente nell'originale, 4 date, dati reali | 64/64 |
| Viste originali su dati Cairn | 64/64 |
| Test unitari + database | 353/353 |
| E2E: fattura offline → sync, F24, promemoria, contratto, simulatore, calendario, cronologia+ripristino, 4 export, accesso offline (aereo, Wi-Fi senza internet, rete lenta) | tutti ok |
| Sblocco biometrico (autenticatore virtuale): attivazione, blocco, sblocco, rifiuto senza verifica, ripiego password | ok |
| Accessibilità axe-core WCAG 2 A/AA, 12 sezioni × desktop/telefono | 0 violazioni (prima 309 nodi) |
| Altezza pagine su telefono | Analisi −65%, Tasse −47%, Da emettere −70% |

## 5. Rollback
- Branch `release/v1` = versione prima del redesign; su Vercel "Instant Rollback" al deployment precedente.
- `tests/fixtures/legacy-original.ts` = viste pre-redesign congelate (base dei test di parità).

// One-off, server-side: creates YOUR account (no public sign-up) and your ledger.
// Run locally with the service role key in the environment — never ship this key to the browser.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/bootstrap-owner.mjs you@example.com "Fascicolo A. Scialabba"
// The user receives an invitation email to set the password.
import { createClient } from "@supabase/supabase-js";

const [email, ledgerName = "Fascicolo personale"] = process.argv.slice(2);
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !url || !key) { console.error("uso: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/bootstrap-owner.mjs email [nome]"); process.exit(1); }

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
if (error) { console.error("Invito non riuscito:", error.message); process.exit(1); }
const { data: ledger, error: e2 } = await admin.rpc("bootstrap_ledger", { p_owner: data.user.id, p_name: ledgerName });
if (e2) { console.error("Creazione fascicolo non riuscita:", e2.message); process.exit(1); }
console.log(`OK: invito inviato a ${email}; fascicolo ${ledger} creato con ruolo super_admin.`);

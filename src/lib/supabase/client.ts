import { createBrowserClient } from "@supabase/ssr";

/** Browser client: uses only the public anon key; all access is decided by RLS. */
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Configurazione mancante: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createBrowserClient(url, key);
}

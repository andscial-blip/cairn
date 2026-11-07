"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Landing page for invitation and password-recovery links. The Supabase client reads the
 * one-time token from the URL and opens a session; the user then chooses a password.
 */
export default function Benvenuto() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    const code = new URLSearchParams(window.location.search).get("code");
    (async () => {
      if (code) await sb.auth.exchangeCodeForSession(code);
      const { data } = await sb.auth.getSession();
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    })();
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { setEmail(s?.user.email ?? null); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 12) { setMsg("Usa almeno 12 caratteri."); return; }
    if (pw !== pw2) { setMsg("Le due password non coincidono."); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setMsg("Non è stato possibile salvare la password: " + error.message);
    else window.location.assign("/");
  }

  return (
    <main className="wrap" style={{ maxWidth: 440, paddingTop: 64 }}>
      <section className="panel">
        <div className="panel-h"><h2>Benvenuto in Cairn</h2></div>
        <div className="panel-b">
          {!ready && <p className="muted">Verifico il link…</p>}
          {ready && !email && <p className="muted">Il link non è valido o è scaduto. Chiedi un nuovo invito oppure usa "Password dimenticata" dalla pagina di accesso.</p>}
          {ready && email && (
            <form onSubmit={save}>
              <p className="muted" style={{ marginTop: 0 }}>Imposta la password per <b>{email}</b>.</p>
              <div className="fields">
                <div className="f s2"><label htmlFor="p1">Nuova password</label><input id="p1" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
                <div className="f s2"><label htmlFor="p2">Ripeti password</label><input id="p2" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
              </div>
              {msg && <p role="status" className="muted" style={{ marginTop: 12 }}>{msg}</p>}
              <button className="btn primary" style={{ marginTop: 16 }} type="submit" disabled={busy}>{busy ? "Salvataggio…" : "Salva password"}</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

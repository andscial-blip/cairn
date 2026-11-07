"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { LocalDB } from "@/offline/db";
import { checkOfflineAccess, type OfflineGrant } from "@/offline/session";
import { isNetworkError } from "@/offline/net";
import { Logo } from "@/components/logo";
import { BRAND } from "@/lib/brand";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offlineUntil, setOfflineUntil] = useState<number | null>(null);
  useEffect(() => { const m = new URLSearchParams(window.location.search).get("m"); if (m) setMsg(m); }, []);
  // A device that already logged in online keeps a time-limited offline access (no password stored).
  useEffect(() => {
    (async () => {
      try {
        const db = new LocalDB(); await db.open();
        const grant = (await db.meta.get("grant"))?.value as OfflineGrant | undefined;
        const membership = await db.meta.get("membership");
        const acc = checkOfflineAccess(grant ?? null);
        if (acc.ok && membership) {
          setOfflineUntil(acc.grant.expiresAt);
          if (!navigator.onLine) window.location.replace("/");
        }
      } catch { /* storage unavailable */ }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password }).catch((e: unknown) => ({ error: e as Error }));
    setBusy(false);
    if (error && isNetworkError(error)) {
      if (offlineUntil) { window.location.assign("/"); return; }
      setMsg("Connessione assente o troppo debole. Il primo accesso su questo dispositivo richiede internet: dopo, Cairn funziona anche offline per 7 giorni.");
      return;
    }
    if (error) setMsg(/confirm/i.test(error.message)
      ? "Email non ancora confermata: apri il link dell'invito oppure usa \"Password dimenticata\"."
      : "Email o password non corrette.");
    else window.location.assign("/");
  }

  async function reset() {
    if (!email) { setMsg("Scrivi prima la tua email."); return; }
    await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/benvenuto` });
    setMsg("Se l'indirizzo è registrato, riceverai un link per reimpostare la password.");
  }

  return (
    <main className="auth">
      <section className="auth-card" aria-labelledby="t">
        <div className="auth-brand"><Logo /><h1 id="t">Cairn</h1><p>{BRAND.tagline}</p></div>
        <form onSubmit={submit}>
          <div className="fields">
            <div className="f s2"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="f s2"><label htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </div>
          {msg && <p className="muted" role="status" style={{ marginTop: 12 }}>{msg}</p>}
          {offlineUntil && <p className="muted" style={{ marginTop: 12 }}>Questo dispositivo ha l&apos;accesso offline fino al {new Date(offlineUntil).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}. <a href="/">Entra senza connessione</a></p>}
          <button className="btn primary" type="submit" disabled={busy} style={{ width: "100%", minHeight: 46, marginTop: 18 }}>{busy ? "Accesso…" : "Accedi"}</button>
          <button className="btn ghost" type="button" onClick={reset} style={{ width: "100%", marginTop: 6 }}>Password dimenticata</button>
        </form>
      </section>
    </main>
  );
}

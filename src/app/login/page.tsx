"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { const m = new URLSearchParams(window.location.search).get("m"); if (m) setMsg(m); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
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
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 64 }}>
      <section className="panel">
        <div className="panel-h"><h2>Accedi a Cairn</h2></div>
        <form className="panel-b" onSubmit={submit}>
          <div className="fields">
            <div className="f s2"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="f s2"><label htmlFor="pw">Password</label><input id="pw" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          </div>
          {msg && <p className="muted" role="status" style={{ marginTop: 12 }}>{msg}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn primary" type="submit" disabled={busy}>{busy ? "Accesso…" : "Accedi"}</button>
            <button className="btn ghost" type="button" onClick={reset}>Password dimenticata</button>
          </div>
        </form>
      </section>
    </main>
  );
}

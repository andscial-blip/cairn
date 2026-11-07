"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/** Shows who is signed in (or why a link failed) and offers logout. */
export function HomeStatus() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    const h = new URLSearchParams(window.location.hash.slice(1));
    const code = h.get("error_code");
    if (code) {
      setLinkError(code === "otp_expired"
        ? "Il link dell'email è scaduto o è già stato usato. Chiedine uno nuovo con \"Password dimenticata\"."
        : "Il link dell'email non è valido. Chiedine uno nuovo con \"Password dimenticata\".");
      history.replaceState(null, "", "/");
    }
    supabaseBrowser().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function logout() {
    await supabaseBrowser().auth.signOut();
    window.location.assign("/login");
  }

  return (
    <>
      {linkError && <p role="alert" className="muted" style={{ color: "var(--red)" }}>{linkError}</p>}
      {email === undefined && <p className="muted">Verifico l&apos;accesso…</p>}
      {email && (
        <p className="muted">Accesso effettuato come <b>{email}</b>. <button type="button" className="btn small ghost" onClick={logout}>Esci</button></p>
      )}
      {email === null && <p className="muted"><a href="/login">Accedi</a></p>}
    </>
  );
}

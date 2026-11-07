"use client";
/** Lock screen + hook. The app content is not rendered while locked. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/app-context";
import { RELOCK_MS, unlockWithBiometrics, type LockConfig } from "@/lib/app-lock";
import { Mark } from "./logo";
import { BRAND } from "@/lib/brand";

let unlockedThisSession = false;

export function useAppLock() {
  const { db, auth } = useApp();
  const [cfg, setCfg] = useState<LockConfig | null | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  const hiddenAt = useRef<number | null>(null);
  useEffect(() => {
    if (!db || auth.kind !== "ready") return;
    void db.meta.get("applock").then((m) => {
      const c = (m?.value as LockConfig | undefined) ?? null;
      const mine = c && c.userId === auth.userId ? c : null;
      setCfg(mine); setLocked(!!mine && !unlockedThisSession);
    });
  }, [db, auth]);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt.current = Date.now();
      else if (cfg && hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_MS) { unlockedThisSession = false; setLocked(true); }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [cfg]);
  const unlocked = useCallback(() => { unlockedThisSession = true; setLocked(false); }, []);
  return { ready: cfg !== undefined, locked: !!cfg && locked, cfg, unlocked };
}

export function LockScreen({ cfg, onUnlocked }: { cfg: LockConfig; onUnlocked: () => void }) {
  const { signOut } = useApp();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tried = useRef(false);
  const go = useCallback(async () => {
    setBusy(true); setMsg(null);
    try { if (await unlockWithBiometrics(cfg)) onUnlocked(); else setMsg("Verifica non riuscita. Riprova o usa email e password."); }
    catch (e) { const n = (e as DOMException).name; setMsg(n === "NotAllowedError" ? "Tocca «Sblocca» per riprovare." : "Sblocco biometrico non disponibile ora: usa email e password."); }
    finally { setBusy(false); }
  }, [cfg, onUnlocked]);
  useEffect(() => { if (!tried.current) { tried.current = true; void go(); } }, [go]);
  return (
    <main className="lockscreen" aria-labelledby="lk">
      <section className="auth-card">
        <div className="auth-brand"><Mark /><h1 id="lk">Cairn è bloccata</h1><p>{BRAND.tagline}</p></div>
        <button className="btn primary" type="button" onClick={go} disabled={busy}>{busy ? "Verifica…" : "Sblocca con Face ID, Touch ID o impronta"}</button>
        <button className="btn ghost" type="button" onClick={signOut}>Usa email e password</button>
        {msg && <p className="muted" role="status" style={{ marginTop: 12 }}>{msg}</p>}
      </section>
    </main>
  );
}

"use client";
/** Lock screen + hook. The app content is not rendered while locked. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/app-context";
import { RELOCK_MS, unlockWithBiometrics, type LockConfig } from "@/lib/app-lock";
import { Mark } from "./logo";
import { BRAND } from "@/lib/brand";

let unlockedThisSession = false;
/**
 * The unlock survives a page reload in the same app session (offline, moving between sections can reload the page):
 * the time of the last activity is kept in sessionStorage and counts for RELOCK_MS, the same window as switching apps.
 */
const KEY = "cairn-unlocked-at";
const recentlyUnlocked = () => { try { const t = Number(sessionStorage.getItem(KEY)); return t > 0 && Date.now() - t < RELOCK_MS; } catch { return false; } };
const touch = () => { try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* private mode */ } };
const forget = () => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } };

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
      if (mine && !unlockedThisSession && recentlyUnlocked()) { unlockedThisSession = true; touch(); }
      setCfg(mine); setLocked(!!mine && !unlockedThisSession);
    });
  }, [db, auth]);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") { hiddenAt.current = Date.now(); if (unlockedThisSession) touch(); }
      else if (cfg && hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_MS) { unlockedThisSession = false; forget(); setLocked(true); }
    };
    const onLeave = () => { if (unlockedThisSession) touch(); };
    const tick = setInterval(() => { if (unlockedThisSession && document.visibilityState === "visible") touch(); }, 30_000);
    document.addEventListener("visibilitychange", onVis); window.addEventListener("pagehide", onLeave);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("pagehide", onLeave); clearInterval(tick); };
  }, [cfg]);
  const unlocked = useCallback(() => { unlockedThisSession = true; touch(); setLocked(false); }, []);
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

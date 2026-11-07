/**
 * Is this failure "no/poor network" (→ use the offline access) rather than a real answer from the server?
 * Browsers word it differently: Chrome "Failed to fetch", Safari/iOS "Load failed", Firefox "NetworkError…".
 * Rule: a 4xx answer is a real answer; anything without an HTTP status, or a known network wording, is network.
 */
export function isNetworkError(e: unknown): boolean {
  if (!e) return false;
  const x = e as { name?: string; status?: number; message?: string };
  if (x.name === "AuthRetryableFetchError" || x.name === "TimeoutError") return true;
  if (typeof x.status === "number" && x.status >= 400 && x.status < 500) return false;
  if (typeof x.status === "number" && x.status >= 500) return true;
  return /failed to fetch|load failed|networkerror|network|internet|offline|timed? ?out|connection|aborted|fetch/i.test(x.message ?? "");
}

/** Rejects with a TimeoutError if the promise does not settle in time (weak mobile connections can hang for minutes). */
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error("timed out"), { name: "TimeoutError" })), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

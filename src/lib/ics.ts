/** iCalendar (RFC 5545) feed for the deadlines the original app used to push to Google Calendar. */
export interface CalItem { key: string; date: string; summary: string; desc?: string; rem?: number[] }

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const ymd = (d: string) => d.replace(/-/g, "");
const nextDay = (d: string) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Folds a content line at 75 octets without splitting a UTF-8 character (continuation lines start with a space). */
export function fold(line: string): string {
  const enc = new TextEncoder(); const out: string[] = []; let cur = ""; let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length; const limit = out.length ? 74 : 75;
    if (bytes + b > limit) { out.push(cur); cur = ""; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs(items: CalItem[], now = new Date(), name = "Cairn – scadenze"): string {
  const L: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cairn//Scadenze//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(name)}`, "X-WR-TIMEZONE:Europe/Rome", "REFRESH-INTERVAL;VALUE=DURATION:PT4H", "X-PUBLISHED-TTL:PT4H"];
  for (const i of items) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date)) continue;
    L.push("BEGIN:VEVENT", `UID:${i.key.replace(/[^\w.-]/g, "-")}@cairn`, `DTSTAMP:${stamp(now)}`, `DTSTART;VALUE=DATE:${ymd(i.date)}`,
      `DTEND;VALUE=DATE:${ymd(nextDay(i.date))}`, `SUMMARY:${esc(i.summary)}`, ...(i.desc ? [`DESCRIPTION:${esc(i.desc)}`] : []), "TRANSP:TRANSPARENT");
    for (const m of i.rem ?? []) L.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(i.summary)}`, `TRIGGER:-PT${Math.round(m)}M`, "END:VALARM");
    L.push("END:VEVENT");
  }
  L.push("END:VCALENDAR");
  return L.map(fold).join("\r\n") + "\r\n";
}

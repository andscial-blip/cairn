import { describe, it, expect } from "vitest";
import { buildIcs, fold } from "@/lib/ics";

describe("ICS feed", () => {
  const ics = buildIcs([
    { key: "f24-abc", date: "2026-11-16", summary: "💶 F24 1.304 € – Rata IV, saldo; acconto", desc: "Tributi: 1792, 1790\nimporto stimato", rem: [900, 10080] },
    { key: "pm-x", date: "2026-12-31", summary: "⏰ Rinnovo YouSud" },
  ], new Date("2026-11-07T08:00:00Z"));
  const lines = ics.split("\r\n");
  it("is a valid all-day calendar with stable UIDs and alarms", () => {
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(ics).toContain("UID:f24-abc@cairn");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261116\r\nDTEND;VALUE=DATE:20261117");
    expect(ics).toContain("DTEND;VALUE=DATE:20270101");
    expect(ics).toContain("TRIGGER:-PT900M"); expect(ics).toContain("TRIGGER:-PT10080M");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
  it("escapes text values", () => {
    expect(ics).toContain("SUMMARY:💶 F24 1.304 € – Rata IV\\, saldo\; acconto");
    expect(ics).toContain("DESCRIPTION:Tributi: 1792\\, 1790\\nimporto stimato");
  });
  it("folds long lines at 75 octets without breaking multi-byte characters", () => {
    const f = fold("SUMMARY:" + "€".repeat(60));
    const enc = new TextEncoder();
    for (const l of f.split("\r\n")) expect(enc.encode(l).length).toBeLessThanOrEqual(75);
    expect(f.split("\r\n").map((l, i) => (i ? l.slice(1) : l)).join("")).toBe("SUMMARY:" + "€".repeat(60));
  });
});

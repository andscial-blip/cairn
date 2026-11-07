import { markSvg } from "@/lib/brand";
/** Mark for night-blue surfaces (side menu). */
export function Logo({ className = "logo" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Cairn" dangerouslySetInnerHTML={{ __html: markSvg({ dark: true }) }} />;
}
/** Mark for light surfaces (splash, sign-in). */
export function Mark({ className = "mark" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markSvg() }} />;
}
/** Wordmark: CAIRN in spaced capitals (IBM Plex Sans 600). */
export function Wordmark({ className = "wordmark" }: { className?: string }) {
  return <span className={className}>CAIRN</span>;
}

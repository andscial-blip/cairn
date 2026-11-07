import { BRAND, markSvg } from "@/lib/brand";
/** Brand tile used in the side menu and on the auth pages. */
export function Logo({ className = "logo" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Cairn"
    dangerouslySetInnerHTML={{ __html: `<rect width="100" height="100" rx="22" fill="${BRAND.night}"/>${markSvg()}` }} />;
}
/** Mark alone for light backgrounds (splash). */
export function Mark({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markSvg({ light: true }) }} />;
}

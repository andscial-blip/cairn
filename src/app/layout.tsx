import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-sans-condensed/latin-500.css";
import "@fontsource/ibm-plex-sans-condensed/latin-600.css";
import "@fontsource/ibm-plex-sans-condensed/latin-700.css";
import "./globals.css";
import "./ds.css";
import { Mark } from "@/components/logo";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Cairn",
  description: "A. Scialabba · P.IVA, tasse e patrimonio",
  icons: { icon: [{ url: "/icons/icon.svg?v=2", type: "image/svg+xml" }, { url: "/favicon.ico?v=2", sizes: "32x32" }], apple: "/icons/apple-touch-icon.png?v=2" },
  appleWebApp: { capable: true, title: "Cairn", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#10151C" }, { color: "#F3F5F8" }], width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        {/* Splash: plain HTML painted with the first byte, removed by CSS as soon as the app (or the login) is ready. No artificial delay. */}
        <div id="splash" aria-hidden="true"><Mark /><p>{BRAND.tagline}</p></div>
        {children}
      </body>
    </html>
  );
}

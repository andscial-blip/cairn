import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cassa e Fisco",
  description: "P.IVA forfettaria, entrate, spese, risparmi e investimenti",
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Cassa e Fisco", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#2E3D52", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cairn",
    short_name: "Cairn",
    description: "A. Scialabba · P.IVA, tasse e patrimonio",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#EEF1F5",
    theme_color: "#2E3D52",
    lang: "it",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

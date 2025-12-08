import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Strategic Value+ | Transforming U.S. Manufacturing",
    short_name: "Strategic Value+",
    description:
      "We help small- and mid-sized U.S. manufacturers win OEM contracts through supplier qualification, ISO certification, and operational readiness.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#37ca37",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
    categories: ["business", "productivity"],
    lang: "en-US",
    dir: "ltr",
  };
}

import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "V+ Academy",
    short_name: "V+ Academy",
    description:
      "Strategic Value+ — supplier readiness, quality systems, cybersecurity and training for U.S. manufacturers.",
    start_url: "/",
    display: "standalone",
    background_color: "#15181C",
    theme_color: "#15181C",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/VPlus_logo.jpg",
        sizes: "any",
        type: "image/jpeg",
      },
    ],
    categories: ["education"],
    lang: "en-US",
    dir: "ltr",
  };
}

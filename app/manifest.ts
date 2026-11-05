import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EFVS UAS Training Academy",
    short_name: "EFVS Academy",
    description:
      "FAA Part 107 Remote Pilot certification preparation and specialized UAS training from Eagle Flight Vertical Solutions.",
    start_url: "/",
    display: "standalone",
    background_color: "#071628",
    theme_color: "#071628",
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
        src: "/images/efvs-mark-light.png",
        sizes: "any",
        type: "image/png",
      },
    ],
    categories: ["education"],
    lang: "en-US",
    dir: "ltr",
  };
}

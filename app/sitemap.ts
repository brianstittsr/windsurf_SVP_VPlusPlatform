import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://academy.efvertical.com";

  const staticPages = [
    "",
    "/pricing",
    "/sign-in",
    "/sign-up",
    "/privacy",
    "/terms",
    "/eula",
  ];

  return staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.5,
  }));
}

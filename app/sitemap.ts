import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://strategicvalueplus.com";

  // Static pages
  const staticPages = [
    "",
    "/about",
    "/company",
    "/leadership",
    "/affiliates",
    "/oem",
    "/contact",
    "/v-edge",
    "/privacy",
    "/terms",
    "/accessibility",
    "/antifragile",
  ];

  const staticSitemap: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/v-edge") ? 0.9 : 0.8,
  }));

  return staticSitemap;
}

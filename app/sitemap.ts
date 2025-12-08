import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://strategicvalueplus.com";

  // Static pages
  const staticPages = [
    "",
    "/about",
    "/company",
    "/leadership",
    "/contact",
    "/services",
    "/v-edge",
    "/v-edge/quality",
    "/v-edge/reshore",
    "/twinedge",
    "/intelledge",
    "/affiliates",
    "/case-studies",
    "/resources",
    "/resources/blog",
    "/resources/guides",
    "/resources/webinars",
    "/events",
    "/faq",
    "/news",
    "/careers",
    "/privacy",
    "/terms",
    "/cookies",
    "/accessibility",
  ];

  const staticSitemap: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/v-edge") || route.startsWith("/twinedge") || route.startsWith("/intelledge") ? 0.9 : 0.8,
  }));

  // Service pages with higher priority
  const servicePages = [
    { url: `${baseUrl}/services/supplier-readiness`, priority: 0.9 },
    { url: `${baseUrl}/services/iso-certification`, priority: 0.9 },
    { url: `${baseUrl}/services/digital-transformation`, priority: 0.9 },
    { url: `${baseUrl}/services/lean-manufacturing`, priority: 0.9 },
  ];

  const serviceSitemap: MetadataRoute.Sitemap = servicePages.map((page) => ({
    url: page.url,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: page.priority,
  }));

  return [...staticSitemap, ...serviceSitemap];
}

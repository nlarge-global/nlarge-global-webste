import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nlargecorp.com";
  const routes = ["", "/services", "/products", "/contact", "/privacy-policy", "/terms-of-service"];

  return routes.map((route, index) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date("2026-11-06"),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : index < 4 ? 0.8 : 0.3,
  }));
}

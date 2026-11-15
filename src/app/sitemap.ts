import type { MetadataRoute } from "next";

/**
 * Public route index.
 *
 * Update the contribution date when the page's public content changes, not when
 * only internal code (API routes, tests, schema, or layout) changes.
 *
 * - Homepage: services also updated.
 * - Services: planned improvements are published.
 * - Products: catalog changes are published.
 * - Contact, support, privacy-policy, terms-of-service: legal or contact-page content updates.
 */
// Update the contribution date when the page's public content changes, not when
// only internal code (API routes, tests, schema, or layout) changes.
const lastModified = {
  "/": "2026-11-15",
  "/services": "2026-11-15",
  "/products": "2026-11-15",
  "/contact": "2026-11-15",
  "/support": "2026-11-15",
  "/privacy-policy": "2026-11-15",
  "/terms-of-service": "2026-11-15",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://nlargecorp.com";
  return (
    Object.entries(lastModified).map(([path, date]) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(date),
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.8,
    }))
  );
}

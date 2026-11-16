import type { MetadataRoute } from "next";
import { guides } from "@/content/guides";
import { siteUrl } from "@/lib/site";

const routes: { path: string; lastModified?: string }[] = [
  { path: "/", lastModified: "2026-11-16" },
  { path: "/services", lastModified: "2026-11-16" },
  { path: "/products", lastModified: "2026-11-16" },
  { path: "/contact", lastModified: "2026-11-16" },
  { path: "/support", lastModified: "2026-11-16" },
  { path: "/privacy-policy", lastModified: "2026-11-15" },
  { path: "/terms-of-service", lastModified: "2026-11-15" },
  { path: "/guides", lastModified: "2026-11-16" },
  ...guides.map((guide) => ({
    path: `/guides/${guide.slug}`,
    lastModified: guide.lastModified,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, lastModified }) => ({
    url: `${siteUrl}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
  }));
}

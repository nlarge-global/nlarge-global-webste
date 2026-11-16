import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { guides } from "@/content/guides";
import { getCurrentLegalDocument } from "@/features/legal/documents";
import { siteUrl } from "@/lib/site";

const routes: { path: string; lastModified?: string }[] = [
  { path: "/", lastModified: "2026-11-16" },
  { path: "/services", lastModified: "2026-11-16" },
  { path: "/products", lastModified: "2026-11-16" },
  { path: "/contact", lastModified: "2026-11-16" },
  { path: "/support", lastModified: "2026-11-16" },
  { path: "/guides", lastModified: "2026-11-16" },
  ...guides.map((guide) => ({
    path: `/guides/${guide.slug}`,
    lastModified: guide.lastModified,
  })),
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const now = new Date();
  const legalRoutes = [
    {
      path: "/privacy-policy",
      lastModified: new Date(getCurrentLegalDocument("privacyPolicy", now).effectiveAt),
    },
    {
      path: "/terms-of-service",
      lastModified: new Date(getCurrentLegalDocument("termsOfService", now).effectiveAt),
    },
  ];

  return [...routes, ...legalRoutes].map(({ path, lastModified }) => ({
    url: `${siteUrl}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
  }));
}

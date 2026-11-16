import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import SoftwaresSection from "@/components/sections/SoftwaresSection";
import { safeJsonLd } from "@/lib/structured-data";
import { organizationId, siteUrl, socialPreviewImage } from "@/lib/site";
import softwares from "@/content/softwares.json";

export const metadata: Metadata = {
  title: "Restaurant, School & Vending Softwares",
  description:
    "Ready-made restaurant management, school website and vending machine softwares with source code. Hosting is separate.",
  keywords: [
    "restaurant management software",
    "restaurant POS software",
    "school website platform",
    "school website software",
    "vending machine inventory management software",
    "ready-made business softwares",
    "softwares with source code",
  ],
  alternates: { canonical: "/softwares" },
  openGraph: {
    title: "Restaurant, School & Vending Softwares | NLarge Global",
    description:
      "Ready-made restaurant management, school website and vending machine softwares, with source-code handover and separately scoped setup.",
    url: "/softwares",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant, School & Vending Softwares | NLarge Global",
    description:
      "Ready-made restaurant management, school website and vending machine softwares, with source-code handover and separately scoped setup.",
    images: [socialPreviewImage.url],
  },
};

export default function SoftwaresPage() {
  const softwaresSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Ready-made softwares by NLarge Global",
    url: `${siteUrl}/softwares`,
    itemListElement: softwares.map((software, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/softwares#${software.slug}`,
        name: software.name,
        url: `${siteUrl}/softwares#${software.slug}`,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: software.category,
        description: software.description,
        provider: { "@id": organizationId },
      },
    })),
  };

  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-white scroll-snap-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(softwaresSchema) }} />
      <Navigation />
      <SoftwaresSection />
      <section>
        <Footer />
      </section>
    </div>
  );
}

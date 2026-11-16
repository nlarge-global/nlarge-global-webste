import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import ProductsSection from "@/components/sections/ProductsSection";
import { safeJsonLd } from "@/lib/structured-data";
import { organizationId, siteUrl, socialPreviewImage } from "@/lib/site";
import products from "@/content/products.json";

export const metadata: Metadata = {
  title: "Restaurant, School & Vending Software",
  description:
    "Ready-made restaurant management software, a school website platform and vending machine software. Includes source code; hosting is separate.",
  keywords: [
    "restaurant management software",
    "restaurant POS software",
    "school website platform",
    "school website software",
    "vending machine inventory management software",
    "ready-made business software",
    "software with source code",
  ],
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Restaurant, School & Vending Software | NLarge Global",
    description:
      "Ready-made restaurant management, school website and vending machine software, with source-code handover and separately scoped setup.",
    url: "/products",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurant, School & Vending Software | NLarge Global",
    description:
      "Ready-made restaurant management, school website and vending machine software, with source-code handover and separately scoped setup.",
    images: [socialPreviewImage.url],
  },
};

export default function ProductsPage() {
  const productsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Ready-made software by NLarge Global",
    url: `${siteUrl}/products`,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/products#${product.slug}`,
        name: product.name,
        url: `${siteUrl}/products#${product.slug}`,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: product.category,
        description: product.description,
        provider: { "@id": organizationId },
      },
    })),
  };

  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-white scroll-snap-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productsSchema) }} />
      <Navigation />
      <ProductsSection />
      <section>
        <Footer />
      </section>
    </div>
  );
}

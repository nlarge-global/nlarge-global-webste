import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import ProductsSection from "@/components/sections/ProductsSection";
import { safeJsonLd } from "@/lib/structured-data";

export const metadata = {
  title: "Products",
  description: "Discover our sophisticated software solutions including Pravli restaurant management system and upcoming innovations.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  const productsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "NLarge Global software products",
    itemListElement: [
      { "@type": "ListItem", position: 1, item: { "@type": "SoftwareApplication", name: "Pravli", applicationCategory: "BusinessApplication", description: "Restaurant management software for orders, tables, billing, inventory and operations." } },
      { "@type": "ListItem", position: 2, item: { "@type": "SoftwareApplication", name: "School digital platform", applicationCategory: "BusinessApplication", description: "A school website for admissions, notices, programs, staff and parent communication." } },
      { "@type": "ListItem", position: 3, item: { "@type": "SoftwareApplication", name: "VendFlow", applicationCategory: "BusinessApplication", description: "Vending machine management software for inventory, payments, maintenance and sales insights." } },
    ],
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



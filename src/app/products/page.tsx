import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import ProductsSection from "@/components/ProductsSection";

export const metadata = {
  title: "Products - NLarge Global",
  description:
    "Discover our sophisticated software solutions including Pravli restaurant management system and upcoming innovations.",
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white scroll-snap-main">
      <Navigation />
      <ProductsSection />
      <section>
        <Footer />
      </section>
    </div>
  );
}



import { Metadata } from "next";
import HomeClient from "./HomeClient";
import { generateSEOMetadata } from "@/utils/seo";

export const metadata: Metadata = generateSEOMetadata({
  title: "NLarge Global - Crafting Excellence in Software Solutions",
  description:
    "NLarge Global crafts exceptional software solutions with timeless elegance and precision. Specialized in web development, mobile apps, and digital innovation for businesses worldwide.",
  keywords: [
    "software development",
    "web development",
    "mobile app development",
    "digital solutions",
    "technology consulting",
    "custom software",
    "NLarge Global",
    "software company",
    "digital transformation",
    "enterprise software",
    "SaaS development",
    "cloud solutions",
  ],
});

export default function HomePage() {
  return <HomeClient />;
}

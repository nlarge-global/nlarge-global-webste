import type { Metadata } from "next";
import type { ReactNode } from "react";
import { safeJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk with NLarge Global about a website, software product, or long-term technology partnership.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact NLarge Global",
    url: "https://nlargecorp.com/contact",
    about: { "@id": "https://nlargecorp.com/#organization" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(contactSchema) }} />
      {children}
    </>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { safeJsonLd } from "@/lib/structured-data";
import { organizationId, siteUrl, socialPreviewImage } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact NLarge Global",
  description: "Contact NLarge Global about a software project, support question, general enquiry, or privacy and personal-data request.",
  keywords: [
    "contact custom software developer",
    "website maintenance support",
    "website redesign project",
    "fix website bugs",
    "add features to an existing app",
    "web application development enquiry",
    "privacy or personal data request",
  ],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact NLarge Global",
    description: "Contact NLarge Global about projects, support, general questions, or privacy and personal-data requests.",
    url: "/contact",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact NLarge Global",
    description:
      "Contact NLarge Global about projects, support, general questions, or privacy and personal-data requests.",
    images: [socialPreviewImage.url],
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact NLarge Global",
    url: `${siteUrl}/contact`,
    about: { "@id": organizationId },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(contactSchema) }} />
      {children}
    </>
  );
}

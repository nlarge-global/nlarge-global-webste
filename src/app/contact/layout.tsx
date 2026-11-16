import type { Metadata } from "next";
import type { ReactNode } from "react";
import { safeJsonLd } from "@/lib/structured-data";
import { organizationId, siteUrl, socialPreviewImage } from "@/lib/site";

export const metadata: Metadata = {
  title: "Discuss a Software Project",
  description: "Contact NLarge Global about custom software, website or app development, website maintenance, bug fixes, redesigns, or adding features to an existing product.",
  keywords: [
    "contact custom software developer",
    "website maintenance support",
    "website redesign project",
    "fix website bugs",
    "add features to an existing app",
    "web application development enquiry",
  ],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Discuss a Software Project | NLarge Global",
    description: "Tell NLarge Global about the software, website or app you want to build, improve, redesign or maintain.",
    url: "/contact",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discuss a Software Project | NLarge Global",
    description:
      "Tell NLarge Global about the software, website or app you want to build, improve, redesign or maintain.",
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

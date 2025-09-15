import { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us - Get In Touch",
  description:
    "Contact NLarge Global for your software development needs. Get in touch with our team for custom solutions, consultations, and project inquiries.",
  keywords: [
    "contact NLarge Global",
    "software development consultation",
    "project inquiry",
    "custom software quote",
    "technology consulting",
    "contact form",
  ],
  openGraph: {
    title: "Contact Us - NLarge Global",
    description:
      "Contact NLarge Global for your software development needs. Get in touch with our team for custom solutions, consultations, and project inquiries.",
  url: "https://nlargecorp.com/contact",
    siteName: "NLarge Global",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Contact NLarge Global",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - NLarge Global",
    description:
      "Contact NLarge Global for your software development needs. Get in touch with our team for custom solutions, consultations, and project inquiries.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://nlargecorp.com/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}

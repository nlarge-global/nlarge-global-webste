import { Metadata } from "next";
import ServicesClient from "./ServicesClient";

export const metadata: Metadata = {
  title: {
    template: "%s | NLarge Global",
    default: "Services | NLarge Global",
  },
  description:
    "Discover our comprehensive software development services including web development, mobile apps, cloud solutions, and digital transformation consulting.",
  keywords: [
    "software development services",
    "web development",
    "mobile app development",
    "cloud solutions",
    "digital transformation",
    "technology consulting",
    "custom software development",
  ],
  openGraph: {
    title: "Services | NLarge Global",
    description:
      "Discover our comprehensive software development services including web development, mobile apps, cloud solutions, and digital transformation consulting.",
  url: "https://nlargecorp.com/services",
    siteName: "NLarge Global",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NLarge Global Services",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Services | NLarge Global",
    description:
      "Discover our comprehensive software development services including web development, mobile apps, cloud solutions, and digital transformation consulting.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://nlargecorp.com/services",
  },
};

export default function ServicesPage() {
  return <ServicesClient />;
}

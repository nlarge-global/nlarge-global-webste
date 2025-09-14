import type React from "react";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import StructuredData from "@/components/StructuredData";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | NLarge Global",
    default: "NLarge Global - Crafting Excellence in Software Solutions",
  },
  description:
    "NLarge Global crafts exceptional software solutions with timeless elegance and precision. Specialized in web development, mobile apps, and digital innovation.",
  keywords: [
    "software development",
    "web development",
    "mobile app development",
    "digital solutions",
    "technology consulting",
    "custom software",
    "NLarge Global",
  ],
  authors: [{ name: "NLarge Global" }],
  creator: "NLarge Global",
  publisher: "NLarge Global",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://nlarge.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NLarge Global - Crafting Excellence in Software Solutions",
    description:
      "NLarge Global crafts exceptional software solutions with timeless elegance and precision.",
    url: "https://nlarge.com",
    siteName: "NLarge Global",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "NLarge Global Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NLarge Global - Crafting Excellence in Software Solutions",
    description:
      "NLarge Global crafts exceptional software solutions with timeless elegance and precision.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} scroll-smooth`}
    >
      <body
        className="antialiased bg-white text-foreground overflow-x-hidden"
        role="main"
      >
        <StructuredData />
        <NextTopLoader color="#000000" />
        {children}
      </body>
    </html>
  );
}

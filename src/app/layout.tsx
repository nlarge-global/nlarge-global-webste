import type React from "react";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Dancing_Script } from "next/font/google";
import "@/styles/globals.css";
import NextTopLoader from "nextjs-toploader";

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

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-dancing",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nlargecorp.com"),
  title: { default: "NLarge Global | Software Built With Responsibility", template: "%s | NLarge Global" },
  description: "NLarge Global builds software, improves existing platforms and takes ownership of long-term success.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "NLarge Global",
    title: "NLarge Global | Software Built With Responsibility",
    description: "NLarge Global builds software, improves existing platforms and takes ownership of long-term success.",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "NLarge Global", description: "Software built with responsibility." },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} ${dancingScript.variable} scroll-smooth`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="NLarge Global" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-white text-foreground overflow-x-hidden">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", "@id": "https://nlargecorp.com/#organization", name: "NLarge Global", url: "https://nlargecorp.com", logo: "https://nlargecorp.com/logo-transparent.png" },
          { "@type": "WebSite", "@id": "https://nlargecorp.com/#website", name: "NLarge Global", url: "https://nlargecorp.com", publisher: { "@id": "https://nlargecorp.com/#organization" } }
        ] }).replace(/</g, "\\u003c") }} />
        <a href="#main-content" className="fixed left-4 top-0 z-[100] -translate-y-full rounded-b-md bg-[#602329] px-4 py-3 text-sm font-semibold text-white focus:translate-y-0">Skip to main content</a>
        <NextTopLoader
          color="#000000"
         />
        {children}
      </body>
    </html>
  );
}

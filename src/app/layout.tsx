import type React from "react";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Dancing_Script } from "next/font/google";
import "@/styles/globals.css";
import NextTopLoader from "nextjs-toploader";
import { safeJsonLd } from "@/lib/structured-data";
import { organizationId, siteUrl, socialPreviewImage } from "@/lib/site";

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
  metadataBase: new URL(siteUrl),
  title: { default: "Custom Software Development | NLarge Global", template: "%s | NLarge Global" },
  description: "Based in Rajasthan, NLarge Global builds custom software, websites and apps for small businesses, and helps improve and maintain existing platforms in India and worldwide.",
  keywords: [
    "custom software development",
    "custom software for small business",
    "website maintenance services",
    "website bug fixes",
    "website redesign",
    "website speed improvement",
    "add features to an existing app",
    "web application development",
    "mobile app development",
    "NLarge Global",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "NLarge Global",
    title: "Custom Software Development | NLarge Global",
    description: "Custom software, website and app development, website maintenance, bug fixes, redesigns, speed improvements and new features for clients in India and worldwide.",
    url: "/",
    images: [socialPreviewImage],
  },
  twitter: { card: "summary_large_image", title: "Custom Software Development | NLarge Global", description: "Build, improve and maintain websites, apps and custom software with NLarge Global in India and worldwide.", images: [socialPreviewImage.url] },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${cormorant.variable} ${dancingScript.variable} scroll-smooth`}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="NLarge Global" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-white text-foreground overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": organizationId,
                  name: "NLarge Global",
                  alternateName: "NLarge",
                  url: siteUrl,
                  logo: `${siteUrl}/logo-transparent.png`,
                  description:
                    "A software development team that plans, builds, improves and supports digital products for clients in India and worldwide.",
                  areaServed: [
                    { "@type": "AdministrativeArea", name: "Rajasthan, India" },
                    { "@type": "Place", name: "Worldwide" },
                  ],
                  email: "info@nlargecorp.com",
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "Business inquiries",
                    email: "info@nlargecorp.com",
                  },
                  founder: [
                    { "@id": `${siteUrl}/#sahil-poonia` },
                    { "@id": `${siteUrl}/#shiva-chahar` },
                  ],
                },
                {
                  "@type": "Person",
                  "@id": `${siteUrl}/#sahil-poonia`,
                  name: "Sahil Poonia",
                  jobTitle: "Founder & CEO",
                  image: `${siteUrl}/ceo.jpg`,
                  worksFor: { "@id": organizationId },
                },
                {
                  "@type": "Person",
                  "@id": `${siteUrl}/#shiva-chahar`,
                  name: "Shiva Chahar",
                  jobTitle: "Co-Founder & COO",
                  image: `${siteUrl}/coo.jpg`,
                  worksFor: { "@id": organizationId },
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  name: "NLarge Global",
                  url: siteUrl,
                  publisher: { "@id": organizationId },
                },
              ],
            }),
          }}
        />
        <a href="#main-content" className="fixed left-4 -top-1 z-[100] -translate-y-full rounded-b-md bg-[#602329] px-4 py-3 text-sm font-semibold text-white focus:translate-y-0">Skip to main content</a>
        <NextTopLoader
          color="#000000"
         />
        {children}
      </body>
    </html>
  );
}

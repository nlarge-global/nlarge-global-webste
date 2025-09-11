import type React from "react";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
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

export const metadata: Metadata = {
  title: "NLarge Global - Crafting Excellence",
  description:
    "NLarge Global - Crafting exceptional software solutions with timeless elegance and precision.",
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
      <head>
        
        <title>NLarge Global | Vintage Elegance & Innovation</title>
        <meta
          name="description"
          content="NLarge Global crafts elegant, classic, and innovative products for a timeless experience."
        />
        <meta name="apple-mobile-web-app-title" content="NLarge Global" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta property="og:title" content="NLarge Global" />
        <meta
          property="og:description"
          content="Vintage, classic, and elegant products for a timeless experience."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nlarge.com" />
        <meta property="og:image" content="/public/globe.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NLarge Global" />
        <meta
          name="twitter:description"
          content="Vintage, classic, and elegant products for a timeless experience."
        />
        <meta name="twitter:image" content="/public/globe.svg" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className=" antialiased bg-white text-foreground overflow-x-hidden"
        role="main"
      >
        <NextTopLoader
          color="#000000"
         />
        {children}
      </body>
    </html>
  );
}

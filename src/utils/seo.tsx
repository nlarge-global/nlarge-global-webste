import { Metadata } from "next";

// Enhanced SEO utility function
export function generateSEOMetadata({
  title,
  description,
  path = "",
  image = "/logo.png",
  noIndex = false,
  keywords = [],
  type = "website",
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
}): Metadata {
  const baseUrl = "https://nlarge.com";
  const url = `${baseUrl}${path}`;

  return {
    title,
    description,
    keywords:
      keywords.length > 0
        ? keywords
        : [
            "software development",
            "web development",
            "mobile app development",
            "digital solutions",
            "NLarge Global",
          ],
    authors: [{ name: "NLarge Global" }],
    creator: "NLarge Global",
    publisher: "NLarge Global",
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "NLarge Global",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@nlargeglobal",
    },
    alternates: {
      canonical: url,
    },
    other: {
      "msapplication-TileColor": "#ffffff",
      "msapplication-config": "/browserconfig.xml",
      "google-site-verification": "your-google-site-verification-code", // Replace with actual code
    },
  };
}

// Component for additional SEO head elements
export function SEOHead() {
  return (
    <>
      {/* DNS Prefetch for external resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />

      {/* Preconnect for critical resources */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
        crossOrigin="anonymous"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* Security headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta
        httpEquiv="Referrer-Policy"
        content="strict-origin-when-cross-origin"
      />

      {/* Mobile optimization */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="msapplication-tap-highlight" content="no" />

      {/* Theme colors for different browsers */}
      <meta
        name="theme-color"
        content="#ffffff"
        media="(prefers-color-scheme: light)"
      />
      <meta
        name="theme-color"
        content="#000000"
        media="(prefers-color-scheme: dark)"
      />

      {/* Microsoft tiles */}
      <meta name="msapplication-TileColor" content="#ffffff" />
      <meta
        name="msapplication-TileImage"
        content="/web-app-manifest-192x192.png"
      />
    </>
  );
}

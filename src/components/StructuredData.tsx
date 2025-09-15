export default function StructuredData() {
  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NLarge Global",
    alternateName: "NLarge",
    description:
      "Professional software development company specializing in web development, mobile applications, and digital solutions with timeless elegance and precision.",
    url: "https://nlargecorp.com",
    logo: {
      "@type": "ImageObject",
      url: "https://nlargecorp.com/logo.png",
      width: 500,
      height: 500,
    },
    image: "https://nlargecorp.com/logo.png",
    email: "info@nlargecorp.com",
    sameAs: ["https://nlargecorp.com"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Remote",
      addressCountry: "Global",
    },
    foundingDate: "2024",
    numberOfEmployees: "1-10",
    industry: "Software Development",
    serviceArea: {
      "@type": "Place",
      name: "Worldwide",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Software Development Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Web Development",
            description:
              "Custom web application development with modern technologies",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Mobile App Development",
            description:
              "Native and cross-platform mobile application development",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Cloud Solutions",
            description:
              "Cloud infrastructure management and deployment services",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Custom Software Development",
            description:
              "Bespoke software solutions tailored to business needs",
          },
        },
      ],
    },
  };

  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NLarge Global",
    url: "https://nlargecorp.com",
    description:
      "Professional software development services with timeless elegance and precision",
    publisher: {
      "@type": "Organization",
      name: "NLarge Global",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://nlargecorp.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Breadcrumb Schema (only for existing routes)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://nlargecorp.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: "https://nlargecorp.com/services",
      },
      // Remove non-existent routes if any
      {
        "@type": "ListItem",
        position: 3,
        name: "Contact",
        item: "https://nlargecorp.com/contact",
      },
    ],
  };

  // Direct script tag insertion (no dangerouslySetInnerHTML)
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </>
  );
}

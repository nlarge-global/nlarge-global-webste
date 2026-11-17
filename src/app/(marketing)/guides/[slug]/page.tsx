import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { guides } from "@/content/guides";
import { safeJsonLd } from "@/lib/structured-data";
import { organizationId, siteUrl, socialPreviewImage } from "@/lib/site";

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) notFound();

  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: `${guide.title} | NLarge Global`,
      description: guide.description,
      url: `/guides/${guide.slug}`,
      siteName: "NLarge Global",
      type: "article",
      images: [socialPreviewImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.title} | NLarge Global`,
      description: guide.description,
      images: [socialPreviewImage.url],
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) notFound();

  const guideUrl = `${siteUrl}/guides/${guide.slug}`;
  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.lastModified,
    mainEntityOfPage: guideUrl,
    image: socialPreviewImage.url,
    publisher: { "@id": organizationId },
  };
  const relatedGuides = guides.filter((item) => item.slug !== guide.slug);

  return (
    <div className="min-h-screen bg-white text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(guideSchema) }}
      />
      <Navigation />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto px-5 pt-24 sm:px-8 lg:px-12"
      >
        <article>
          <header className="border-b border-black pb-10">
            <Link
              href="/guides"
              className="text-sm font-semibold text-[#602329] underline underline-offset-4"
            >
              All guides
            </Link>
            <h1 className="mt-7 text-[2rem] lg:text-[clamp(3rem,6vw,5rem)] leading-[0.9] tracking-[-0.055em]">
              {guide.title}
            </h1>
            <p className="mt-6  text-lg leading-8 text-black/65">
              {guide.description}
            </p>
          </header>

          <div className="mx-auto space-y-12 py-12 sm:py-16">
            {guide.sections.map((section) => (
              <section key={section.heading} className="space-y-5">
                <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em]">
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-8 text-black/70">
                    {paragraph}
                  </p>
                ))}
                {section.points && (
                  <ul className="list-disc space-y-3 pl-6 text-base leading-7 text-black/70">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>

        <section
          aria-labelledby="related-guides-title"
          className="border-t border-black pt-10"
        >
          <h2
            id="related-guides-title"
            className="text-3xl font-semibold tracking-[-0.04em]"
          >
            More practical guides
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {relatedGuides.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/guides/${item.slug}`}
                  className="block rounded-xl bg-[#f1efea] p-5 font-semibold leading-6 underline decoration-transparent underline-offset-4 hover:decoration-[#602329] focus-visible:decoration-[#602329]"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-black/70">
            Need help with a website or app?{" "}
            <Link
              href="/contact"
              className="font-semibold text-[#602329] underline underline-offset-4"
            >
              Tell us what you are trying to improve.
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

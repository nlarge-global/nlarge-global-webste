import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { guides } from "@/content/guides";
import { socialPreviewImage } from "@/lib/site";

export const metadata: Metadata = {
  title: "Website & Software Guides",
  description:
    "Practical guides to website maintenance, taking over an existing codebase, diagnosing a slow website, and planning a redesign or new feature.",
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Website & Software Guides | NLarge Global",
    description:
      "Practical advice for maintaining, improving, redesigning, and building websites and software.",
    url: "/guides",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Website & Software Guides | NLarge Global",
    description:
      "Practical advice for maintaining, improving, redesigning, and building websites and software.",
    images: [socialPreviewImage.url],
  },
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto px-5 pt-32 sm:px-8 lg:px-12 lg:pt-28"
      >
        <header className="border-b border-black pb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#602329]">
            Practical advice
          </p>
          <h1 className="mt-5 text-[clamp(3rem,8vw,6rem)] leading-[0.86] tracking-[-0.055em]">
            Website & software guides.
          </h1>
          <p className="mt-6  text-lg leading-8 text-black/70">
            Straightforward guidance for maintaining a website, improving an
            existing product, and planning the next change.
          </p>
        </header>

        <section
          aria-label="All guides"
          className="grid gap-4 pt-10 md:grid-cols-2"
        >
          {guides.map((guide, index) => (
            <article
              key={guide.slug}
              className="flex min-h-64 flex-col justify-between rounded-[1.25rem] bg-[#f1efea] p-6 sm:p-8"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#602329]">
                Guide 0{index + 1}
              </span>
              <div className="mt-10">
                <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em]">
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="underline decoration-transparent underline-offset-4 hover:decoration-[#602329] focus-visible:decoration-[#602329]"
                  >
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-4 leading-7 text-black/65">
                  {guide.description}
                </p>
              </div>
              <Link
                href={`/guides/${guide.slug}`}
                className="mt-8 w-fit border-b border-[#602329] pb-1 text-sm font-semibold text-[#602329]"
              >
                Read guide
              </Link>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}

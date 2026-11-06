"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FiPause, FiPlay } from "react-icons/fi";
import testimonials from "@/content/testimonials.json";

const sidePortraits = [
  testimonials[0].image,
  testimonials[1].image,
  testimonials[2].image,
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const testimonial = testimonials[active];
  const testimonialSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NLarge Global",
    aggregateRating: { "@type": "AggregateRating", ratingValue: "5", reviewCount: testimonials.length },
    review: testimonials.map((item) => ({
      "@type": "Review",
      author: { "@type": "Person", name: item.name },
      reviewRating: { "@type": "Rating", ratingValue: item.stars, bestRating: 5 },
      reviewBody: item.description,
    })),
  };

  return (
    <section aria-labelledby="testimonials-title" className="flex min-h-fit sm:min-h-full  w-full items-center justify-center ">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(testimonialSchema).replace(/</g, "\\u003c") }} />
      <div className="testimonial-layout relative min-h-fit w-full overflow-visible sm:min-h-[46rem]">
        <div className="side-portraits side-portraits-left" aria-hidden="true">
          {sidePortraits.map((src, index) => (
            <span key={`left-${src}-${index}`} className={`testimonial-side-photo testimonial-side-photo-${index + 1}`}>
              <Image src={src} alt="" fill sizes="220px" className="object-cover" />
            </span>
          ))}
        </div>
        <div className="testimonial-content relative z-10 mx-auto flex min-h-[24rem] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[46rem] sm:px-4">
          <div className="mb-5 flex items-center flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60">Our People</p>
            <span className="flex items-center gap-3">
              <span className="h-px w-16 overflow-hidden bg-black/15" aria-hidden="true">
                <span key={active} className={`testimonial-progress block h-full origin-left bg-[#602329]${paused ? " is-paused" : ""}`} />
              </span>
              <button type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Play testimonials" : "Pause testimonials"} className="grid size-8 place-items-center rounded-full border border-black/15 text-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]">
                {paused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}
              </button>
            </span>
          </div>
          <h2 id="testimonials-title" className="text-[clamp(2.7rem,5vw,4.8rem)] leading-[0.92] tracking-[-0.05em]">
            Why Trust Us?<br />Because Others Do.
          </h2>
          <figure className="mt-7 w-full">
            <blockquote>
              <p className="mx-auto max-w-2xl text-base leading-7 sm:text-lg">“{testimonial.description}”</p>
            </blockquote>
            
            <figcaption className="mt-5 flex items-center justify-center gap-3 text-left">
              <span className="relative block size-14 shrink-0 overflow-hidden rounded-full bg-white">
                <Image key={testimonial.image} src={testimonial.image} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span>
                <strong className="block text-sm">{testimonial.name}</strong>
                <span className="mt-0.5 block text-xs text-black/60">{testimonial.position}</span>
              </span>
            </figcaption>
            <div className="mt-6 flex items-center justify-center gap-1 text-[#ffb62f]" aria-label={`${testimonial.stars} out of 5 stars`}>
              {Array.from({ length: 5 }, (_, index) => (
                <svg key={index} viewBox="0 0 20 20" className={index < testimonial.stars ? "size-8 fill-current" : "size-4 fill-black/15"} aria-hidden="true">
                  <path d="m10 1.7 2.46 5 5.51.8-3.99 3.88.94 5.49L10 14.28l-4.92 2.59.94-5.49L2.03 7.5l5.51-.8L10 1.7Z" />
                </svg>
              ))}
            </div>
          </figure>
        </div>
        <div className="side-portraits side-portraits-right" aria-hidden="true">
          {[sidePortraits[2], sidePortraits[0], sidePortraits[1]].map((src, index) => (
            <span key={`right-${src}-${index}`} className={`testimonial-side-photo testimonial-side-photo-${index + 1}`}>
              <Image src={src} alt="" fill sizes="220px" className="object-cover" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

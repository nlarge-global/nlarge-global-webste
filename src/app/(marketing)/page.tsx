import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import TestimonialsSection from "@/features/showcase/components/TestimonialsSection";
import DeviceShowcase from "@/features/showcase/components/DeviceShowcase";
import ServicesSection from "@/components/sections/ServicesSection";
import Image from "next/image";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

export default function HomePage() {
  return (
    <div className="w-full bg-white text-black">
      <Navigation />
      <main id="main-content" tabIndex={-1}>
        <section
          aria-labelledby="proof-title"
          className="flex min-h-[100svh] items-center overflow-hidden px-4 py-24 sm:px-4 lg:px-12 lg:py-28"
        >
          <div className="grid w-full min-h-[calc(100svh-12rem)] overflow-hidden rounded-[1.75rem] lg:h-[min(70rem,72svh)] lg:min-h-[34rem] lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-between px-2 py-8 sm:px-10 lg:px-12 lg:py-12">
              <p className="sm:block hidden text-sm font-semibold uppercase tracking-[0.16em]">
                We build · We improve · We take ownership
              </p>
              <div>
                <h1
                  id="proof-title"
                  className="max-w-[10ch] text-[clamp(3.2rem,4.7vw,5rem)] leading-[0.9] tracking-[-0.055em]"
                >
                  Build what's{" "}
                  <span className="text-[#602329]">next.</span>
                </h1>
                <p className="mt-8 max-w-md text-lg leading-8 text-black/65">
                  From a new idea to an existing platform, we build custom
                  software, websites and apps, then stay involved to improve
                  and maintain them after launch.
                </p>
              </div>
              <Link
                href="/services"
                className="w-fit flex gap-2 group border-b border-[#602329] pb-2 text-sm font-semibold text-[#602329]"
              >
                Explore our capabilities
                <FiArrowUpRight
                  className="relative text-xl group-hover:rotate-45 transition"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <DeviceShowcase />
          </div>
        </section>

        <section className="border-y border-black/10 bg-[#f7f5f1] px-5 py-14 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            <p className="text-xl leading-8 text-black sm:text-2xl sm:leading-9">
              Based in Rajasthan, India, NLarge Global helps small businesses,
              founders and individuals across India and worldwide build custom
              software, business websites and mobile apps.
            </p>
            <p className="max-w-2xl text-base leading-7 text-black/70">
              We also improve existing products with bug fixes, speed
              improvements, redesigns, new features and integrations, and
              provide ongoing website maintenance and support after launch.
            </p>
          </div>
        </section>

        <TestimonialsSection />

        <ServicesSection />

        <section
          aria-labelledby="team-title"
          className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div className="flex flex-col">
              <p className="mb-auto hidden text-[7rem] font-bold  text-[#602329] lg:block leading-[1]">
                We're NLarge Global.
              </p>
              <div>
                <h2
                  id="team-title"
                  className="max-w-[8ch] text-[clamp(3.7rem,7vw,6.5rem)] leading-[0.86] tracking-[-0.055em]"
                >
                  The people stay close.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-7 text-black/60">
                  NLarge Global stays close to the work, from understanding the
                  need to building and improving the product.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  name: "Sahil Poonia",
                  role: "Founder & CEO",
                  image: "/ceo.jpg",
                },
                {
                  name: "Shiva Chahar",
                  role: "Co-Founder & COO",
                  image: "/coo.jpg",
                },
              ].map((person) => (
                <figure key={person.name}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#f2f2ef]">
                    <Image
                      src={person.image}
                      alt={person.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 22vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="pt-3">
                    <strong className="block">{person.name}</strong>
                    <span className="text-sm text-black/60">{person.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="contact-title"
          className="px-4 pb-4 sm:px-8 lg:px-12 lg:pb-12"
        >
          <div className="grid min-h-[70svh] place-items-center rounded-[1.75rem] bg-[#602329] px-6 text-center text-white">
            <div>
              <h2
                id="contact-title"
                className="max-w-[9ch] text-[clamp(4rem,9vw,8rem)] leading-[0.84] tracking-[-0.055em]"
              >
                Ready to build the next useful thing?
              </h2>
              <Link
                href="/contact"
                className="mt-10 inline-block border-b border-white pb-2 font-semibold"
              >
                Tell us about it →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

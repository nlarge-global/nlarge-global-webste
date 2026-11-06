import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { safeJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Services",
  description: "Website development, custom software and ongoing maintenance services from NLarge Global.",
  alternates: { canonical: "/services" },
};

const developmentServices = [
  {
    number: "01",
    name: "Discovery & planning",
    text: "We clarify the audience, goals, content, features and technical requirements before design or development begins.",
    includes: ["Requirements workshop", "User flows", "Content planning", "Technical roadmap"],
  },
  {
    number: "02",
    name: "UX & interface design",
    text: "We turn the plan into a clear, accessible experience that feels consistent across desktop, tablet and mobile.",
    includes: ["Figma", "Canva", "Blender", "Adobe Creative Cloud"],
  },
  {
    number: "03",
    name: "Website development",
    text: "We build fast, maintainable websites using modern tools and production-ready code that is easy to extend.",
    includes: ["Next.js / React", "WordPress / PHP", "Java / Python", "Headless CMS"],
  },
  {
    number: "04",
    name: "Commerce & integrations",
    text: "Connect the website to the systems your business already uses, or add focused commerce and business workflows.",
    includes: ["Payments", "Booking systems", "CRM & APIs", "Analytics"],
  },
  {
    number: "05",
    name: "Launch & optimization",
    text: "Before launch, we test real journeys, improve performance and prepare the content and technical foundation for search.",
    includes: ["QA & accessibility", "SEO setup", "Performance", "Deployment"],
  },
];

const maintenanceServices = [
  { name: "Updates & fixes", text: "Routine content changes, bug fixes and small improvements are handled without disrupting the rest of your site." },
  { name: "Monitoring & uptime", text: "We keep watch on availability and performance, catch issues early and respond when something needs attention." },
  { name: "Security & backups", text: "Updates, dependency checks, backups and recovery planning help keep the platform protected and maintainable." },
  { name: "Speed & reliability", text: "We review Core Web Vitals, accessibility, forms, integrations and hosting to improve everyday reliability." },
  { name: "Ongoing improvements", text: "A practical roadmap turns feedback and analytics into useful releases as your business and visitors evolve." },
];

export default function ServicesPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Software development and technology services",
    provider: { "@id": "https://nlargecorp.com/#organization" },
    serviceType: ["Website development", "Custom software development", "Platform improvement", "Technical maintenance"],
    areaServed: "Worldwide",
    description: "Discovery, interface design, website development, integrations, launch and ongoing software ownership from NLarge Global.",
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(serviceSchema) }} />
      <Navigation />
      <main id="main-content" tabIndex={-1}>
        <section className="px-4 pb-8 pt-28 sm:px-8 sm:pt-32 lg:px-12 lg:pb-12">
          <div className="grid min-h-[calc(100svh-10rem)] overflow-hidden rounded-[1.75rem] bg-[#602329] lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-between px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Services · Built to last</p>
              <div>
                <h1 className="max-w-[8ch] text-[clamp(4rem,9vw,8rem)] leading-[0.84] tracking-[-0.055em]">From idea to useful website.</h1>
                <p className="mt-7 max-w-md text-lg leading-8 text-white/70">
                  Strategy, design, development and ownership—handled as one connected process.
                </p>
              </div>
              <Link href="/contact" className="mt-10 inline-flex w-fit items-center gap-3 border-b border-white pb-2 text-sm font-semibold text-white">
                Discuss a project <FiArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            <div className="grid content-center gap-px bg-black/10 p-5 sm:p-8 lg:p-12">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] bg-black/10 sm:grid-cols-3">
                {["Planning / Strategy", "UI/UX & Design", "Web & App Development", "AI Integration", "Chatbots", "Voice Assistants", "Dashboards", "CMS & SEO", "CI/CD & DevOps", "Integrations", "Launch & Support", "Micro Services"].map((item, index) => (
                  <div key={item} className="flex min-h-28 flex-col justify-between bg-[#f1efea] p-5 sm:min-h-36">
                    <span className="text-xs text-black/60">{index > 8 ? "" : 0}{index + 1}</span>
                    <span className="text-lg font-semibold tracking-[-0.03em] sm:text-xl">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="development-title" className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Website development</p>
              <h2 id="development-title" className="mt-5 max-w-[8ch] text-[clamp(3.8rem,7vw,6.5rem)] leading-[0.86] tracking-[-0.055em]">What we can build.</h2>
            </div>
            <div className="border-t border-black">
              {developmentServices.map((service) => (
                <article key={service.name} className="grid gap-5 border-b border-black py-7 sm:grid-cols-[3rem_0.9fr_1.1fr] sm:py-8">
                  <span className="text-sm text-black/60">{service.number}</span>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.03em]">{service.name}</h3>
                    <p className="mt-4 leading-7 text-black/60">{service.text}</p>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm sm:border-l sm:border-black/15 sm:pl-8">
                    {service.includes.map((item) => <li key={item} className="border-b border-black/10 pb-2">{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="maintenance-title" className="px-4 pb-4 sm:px-8 lg:px-12 lg:pb-12">
          <div className="rounded-[1.75rem] bg-[#f1efea] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
            <div className="grid gap-8 border-b border-black pb-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">After launch</p>
                <h2 id="maintenance-title" className="mt-5 text-[clamp(3.7rem,7vw,6rem)] leading-[0.86] tracking-[-0.055em]">Maintenance with a human response.</h2>
              </div>
              <div className="max-w-xl lg:justify-self-end">
                <p className="text-lg leading-8 text-black/60">
                  A website should keep getting safer, faster and more useful. Our maintenance plans cover the work behind the scenes and the improvements visitors can feel.
                </p>
                <p className="mt-6 border-l border-[#602329] pl-5 text-sm leading-7 text-black/70">
                  We also help public institutions move digital transformation forward via building accessible, dependable services for citizens and teams, with security and long-term ownership in mind.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3">
              {maintenanceServices.map((service, index) => (
                <article key={service.name} className="border-b border-black/20 py-8 md:px-6 lg:min-h-64">
                  <span className="text-sm text-black/60">0{index + 1}</span>
                  <h3 className="mt-12 text-2xl font-semibold tracking-[-0.03em]">{service.name}</h3>
                  <p className="mt-4 leading-7 text-black/60">{service.text}</p>
                </article>
              ))}
            </div>
            <Link href="/contact" className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#602329] py-4 pl-6 pr-4 text-sm font-semibold text-white">
              Plan ongoing support
              <span className="grid size-9 place-items-center rounded-full bg-white text-[#602329]"><FiArrowUpRight aria-hidden="true" /></span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

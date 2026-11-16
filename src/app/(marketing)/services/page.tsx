import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowUpRight, FiChevronDown } from "react-icons/fi";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import ServiceExplorer from "@/features/services/components/ServiceExplorer";
import { safeJsonLd } from "@/lib/structured-data";
import { organizationId, socialPreviewImage } from "@/lib/site";

export const metadata: Metadata = {
  title: "Website Maintenance & Software Development",
  description:
    "Based in Rajasthan, India, NLarge Global provides website maintenance, bug fixes, speed improvements, redesigns and new features, plus custom software, web and app development worldwide.",
  keywords: [
    "website maintenance services",
    "website support",
    "website bug fixes",
    "improve website speed",
    "custom software development",
    "custom web application development",
    "website redesign",
    "restructure a website",
    "add features to an existing app",
    "mobile-friendly website development",
    "dashboard development",
    "API integrations",
    "CMS and SEO",
    "software launch support",
  ],
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Website Maintenance & Software Development | NLarge Global",
    description:
      "Based in Rajasthan, India, NLarge Global helps clients worldwide maintain, fix, redesign and extend websites and software.",
    url: "/services",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Maintenance & Software Development | NLarge Global",
    description:
      "Based in Rajasthan, India, NLarge Global helps clients worldwide maintain, fix, redesign and extend websites and software.",
    images: [socialPreviewImage.url],
  },
};

const developmentServices = [
  {
    number: "01",
    name: "Planning / Strategy",
    summary: "Goals, scope and roadmap.",
    text: "Plan a website, app or software product around its users, goals, feature scope and practical release priorities.",
    includes: [
      "Requirements",
      "User flows",
      "Feature scope",
      "Project roadmap",
    ],
  },
  {
    number: "02",
    name: "UI/UX & Design",
    summary: "Clear journeys and responsive interfaces.",
    text: "Design user journeys and responsive interfaces for websites, web applications and mobile apps.",
    includes: ["Figma", "Canva", "Blender", "Adobe Creative Cloud"],
  },
  {
    number: "03",
    name: "Web & App Development",
    summary: "Websites, apps and custom software.",
    text: "Build and improve websites, web applications and mobile apps around your users, business goals and technical needs.",
    includes: [
      "Next.js / React",
      "WordPress / PHP",
      "Java / Python",
      "Headless CMS",
    ],
  },
  {
    number: "04",
    name: "AI Integration",
    summary: "AI for useful product workflows.",
    text: "Add AI capabilities to a website, application or business workflow when they solve a defined user or operational need.",
    includes: [
      "AI-powered features",
      "Workflow integration",
      "Existing systems",
      "Use-case planning",
    ],
  },
  {
    number: "05",
    name: "Chatbots",
    summary: "Answers and guided user tasks.",
    text: "Build website or app chatbots to answer common questions and help people find information or complete routine tasks.",
    includes: [
      "Website chatbots",
      "Common questions",
      "Guided workflows",
      "Service information",
    ],
  },
  {
    number: "06",
    name: "Voice Assistants",
    summary: "Voice interfaces for product workflows.",
    text: "Add voice-based interactions to a product or workflow where speaking is a useful way for people to get things done.",
    includes: [
      "Voice interfaces",
      "Spoken requests",
      "Product workflows",
      "Assistant integration",
    ],
  },
  {
    number: "07",
    name: "Dashboards",
    summary: "Operational views and business reporting.",
    text: "Build business and admin dashboards that bring relevant information and operational controls into a clearer interface.",
    includes: [
      "Admin dashboards",
      "Business reporting",
      "Operational views",
      "Data visualization",
    ],
  },
  {
    number: "08",
    name: "CMS & SEO",
    summary: "Content management and technical SEO.",
    text: "Make website content easier to manage and improve technical SEO with clear page structure, metadata and structured data.",
    includes: [
      "Content management",
      "Page structure",
      "Metadata",
      "Structured data",
    ],
  },
  {
    number: "09",
    name: "CI/CD & DevOps",
    summary: "Build, release and deployment workflows.",
    text: "Set up build and deployment workflows and the operational tooling needed to release and maintain software.",
    includes: [
      "CI/CD pipelines",
      "Build automation",
      "Deployment workflows",
      "Hosting setup",
    ],
  },
  {
    number: "10",
    name: "Integrations",
    summary: "APIs, payments, CRMs and business tools.",
    text: "Connect websites and applications to APIs, payment services, booking tools, CRMs and other business systems.",
    includes: ["APIs", "Payments", "Booking systems", "CRM and business tools"],
  },
  {
    number: "11",
    name: "Launch & Support",
    summary: "Release preparation and ongoing support.",
    text: "Prepare a website or application for release, then provide support and maintenance according to the agreed scope or plan.",
    includes: [
      "Quality checks",
      "Accessibility review",
      "Deployment",
      "Ongoing support",
    ],
  },
  {
    number: "12",
    name: "Micro Services",
    summary: "Independent services and APIs.",
    text: "Design and build microservices when independent service boundaries or deployment needs justify that architecture.",
    includes: [
      "Service boundaries",
      "API design",
      "Independent deployment",
      "Architecture planning",
    ],
  },
];

const maintenanceServices = [
  {
    name: "Updates & fixes",
    text: "Routine content changes, bug fixes and small improvements are handled without disrupting the rest of your site.",
  },
  {
    name: "Monitoring & uptime",
    text: "We keep watch on availability and performance, catch issues early and respond when something needs attention.",
  },
  {
    name: "Security & backups",
    text: "Updates, dependency checks, backups and recovery planning help keep the platform protected and maintainable.",
  },
  {
    name: "Speed & reliability",
    text: "We review Core Web Vitals, accessibility, forms, integrations and hosting to improve everyday reliability.",
  },
  {
    name: "Ongoing improvements",
    text: "A practical roadmap turns feedback and analytics into useful releases as your business and visitors evolve.",
  },
];

const serviceFaqs = [
  {
    question: "Can you improve a website or app we already have?",
    answer:
      "Yes. We can assess an existing website or application, then scope changes such as bug fixes, restructuring, usability improvements, performance work or new features.",
  },
  {
    question: "Do you build custom websites and mobile apps?",
    answer:
      "Yes. We plan and build websites, web applications and mobile apps for small businesses, founders and individuals in India and worldwide.",
  },
  {
    question: "Where do you provide software development services?",
    answer:
      "NLarge Global works with small businesses, founders and individuals in India and worldwide.",
  },
  {
    question: "Can you add AI, a chatbot or a voice assistant?",
    answer:
      "These are among our listed services. We first clarify the intended use and existing product or workflow, then scope an approach around that need.",
  },
  {
    question: "Do you provide support after launch?",
    answer:
      "Yes. Launch support and ongoing maintenance are available according to the agreed scope or selected plan.",
  },
  {
    question: "Can you guarantee search rankings or AI search mentions?",
    answer:
      "No. We can improve technical SEO, page content and structured data, but search rankings and inclusion in AI-generated answers are controlled by search platforms and cannot be guaranteed.",
  },
];

export default function ServicesPage() {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Software development and digital services",
    provider: { "@id": organizationId },
    serviceType: developmentServices.map((service) => service.name),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Software and digital services",
      itemListElement: developmentServices.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.text,
        },
      })),
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Rajasthan, India" },
      { "@type": "Place", name: "Worldwide" },
    ],
    description:
      "Planning, design, web and app development, AI integration, chatbots, voice assistants, dashboards, CMS and SEO, DevOps, integrations, launch support and microservices for clients in India and worldwide.",
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(serviceSchema) }}
      />
      <Navigation />
      <main id="main-content" tabIndex={-1}>
        <section className="px-4 pb-8 pt-24 sm:px-8 sm:pt-28 lg:px-12 lg:pb-12">
          <div className="grid min-h-[calc(100svh-10rem)] overflow-hidden rounded-[1.75rem] bg-[#602329] lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-between px-6 py-8 text-white sm:px-10 lg:px-12 lg:py-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Services · Built to last
              </p>
              <div>
                <h1 className="text-[clamp(4rem,3vw,6rem)] leading-[0.84] tracking-[-0.055em]">
                  Custom software, websites and apps.
                </h1>
                <p className="mt-7 max-w-md text-lg leading-8 text-white/70">
                  <span className="sr-only">
                    Based in Rajasthan, India, NLarge Global provides software
                    development services for small businesses, founders and
                    individuals:{" "}
                  </span>
                  Plan, design, build and support websites, web apps, mobile
                  apps and custom software for clients in India and worldwide.
                </p>
              </div>
              <Link
                href="/contact"
                className="mt-10 inline-flex w-fit items-center gap-3 border-b border-white pb-2 text-sm font-semibold text-white"
              >
                Discuss a project <FiArrowUpRight aria-hidden="true" />
              </Link>
            </div>
            <div className="grid content-center gap-px bg-black/10 p-5 sm:p-8 lg:p-12">
              <ServiceExplorer services={developmentServices} />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="maintenance-title"
          className="px-4 pb-4 pt-16 sm:px-8 lg:px-12 lg:pb-12"
        >
          <div className="">
            <div className="grid gap-8 border-b border-black pb-10 lg:grid-cols-2 lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
                  After launch
                </p>
                <h2
                  id="maintenance-title"
                  className="mt-5 text-[clamp(3.7rem,7vw,6rem)] leading-[0.9] tracking-[-0.045em]"
                >
                  Maintenance with a human response.
                </h2>
              </div>
              <div className="max-w-3xl lg:justify-self-end">
                <p className="text-lg leading-8 text-black/60">
                  A website should keep getting safer, faster and more useful.
                  Our maintenance plans cover the work behind the scenes and the
                  improvements visitors can feel.
                </p>
                <p className="mt-6 border-l border-[#602329] pl-5 text-sm leading-7 text-black/70">
                  We also help public institutions move digital transformation
                  forward via building accessible, dependable services for
                  citizens and teams, with security and long-term ownership in
                  mind.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
              {maintenanceServices.map((service, index) => (
                <article
                  key={service.name}
                  className="border-b border-black/20 lg:min-h-64 "
                >
                  <span className="text-sm text-black/60">0{index + 1}</span>
                  <h3 className="mt-12 text-2xl font-semibold tracking-[-0.03em]">
                    {service.name}
                  </h3>
                  <p className="mt-4 leading-7 text-black/60">{service.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="services-faq-title"
          className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12 lg:pb-28"
        >
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <h2
              id="services-faq-title"
              className="max-w-[8ch] text-[clamp(3.7rem,7vw,6rem)] leading-[0.86] tracking-[-0.055em]"
            >
              Common questions.
            </h2>
            <div className="border-t border-black/15">
              {serviceFaqs.map(({ question, answer }) => (
                <details
                  key={question}
                  className="group border-b border-black/15 py-5"
                >
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329] [&::-webkit-details-marker]:hidden">
                    <h3 className="text-lg font-semibold sm:text-xl">
                      {question}
                    </h3>
                    <FiChevronDown
                      aria-hidden="true"
                      className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className="mt-3 max-w-2xl leading-7 text-black/65">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
          <div className="mx-auto mt-14 grid max-w-6xl gap-8 rounded-[1.5rem] bg-[#f1efea] p-6 sm:p-9 lg:mt-20 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-12">
            <div>
              <h3 className="max-w-[16ch] text-[clamp(2.5rem,5vw,4rem)] leading-[0.92] tracking-[-0.05em]">
                Have a project in mind?
              </h3>
              <p className="mt-5 max-w-2xl text-base leading-7 text-black/70 sm:text-lg sm:leading-8">
                Tell us what you are planning or what needs to improve. We can
                talk through a practical next step together.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-[#602329] py-2 pl-6 pr-3 text-sm font-semibold text-white transition-colors hover:bg-[#481a1e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329]"
            >
              Start a conversation
              <span className="grid size-9 place-items-center rounded-full bg-white text-[#602329]">
                <FiArrowUpRight aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

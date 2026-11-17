import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

const capabilities = [
  {
    name: "Build",
    text: "Custom software, business platforms, individual solutions and ready-made softwares shaped around real needs.",
    link: "Explore development",
  },
  {
    name: "Improve",
    text: "Redesigns, codebase assessments, bug fixes, new features, performance, security and usability improvements.",
    link: "Improve a platform",
  },
  {
    name: "Take ownership",
    text: "Maintenance, technical support, monitoring and long-term management for platforms that need to keep moving.",
    link: "Discuss ownership",
  },
];

export default function ServicesSection() {
  return (
    <section
      aria-labelledby="services-title"
      className="bg-white px-5 py-24 sm:px-8 sm:py-32 lg:px-12"
    >
      <div className="mx-auto">
        <div className="grid gap-8 border-b border-foreground/20 pb-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2
              id="services-title"
              className="max-w-[10ch] font-serif text-[clamp(3.5rem,8vw,7rem)] leading-[0.88] tracking-[-0.04em] max-lg:text-[clamp(3.5rem,8vw,7rem)]"
            >
              What we <span className="text-[#602329]">do.</span>
            </h2>
            <p className="text-lg max-w-4xl leading-8 text-foreground/65">
              Based in Rajasthan, India, NLarge Global helps small businesses,
              founders and individuals across India and worldwide build custom
              software, business websites and mobile apps.
            </p>
          </div>
          <div className="max-w-xl flex flex-col gap-4 justify-end text-lg leading-6 text-foreground/65 lg:self-end lg:justify-self-end">
            <p className="text-base leading-7 text-black/70 border-l border-[#602329] px-5">
              We also improve existing products with bug fixes, speed
              improvements, redesigns, new features and integrations, and
              provide ongoing website maintenance and support after launch.
            </p>
            <p className="max-w-xl text-lg leading-8 text-foreground/65 lg:self-end lg:justify-self-end">
              From a first release to an existing platform that needs more care,
              we focus on useful, durable technology <br />{" "}
              <span className="font-semibold text-[#602329]">
                Not unnecessary complexity.
              </span>
            </p>
          </div>
        </div>
        <div className="divide-y divide-foreground/15">
          {capabilities.map((capability, index) => (
            <Link
              key={capability.name}
              href="/services"
              className="group grid gap-6 py-9 transition sm:grid-cols-[6rem_1fr_1fr_auto] sm:items-center sm:py-12"
            >
              <span className="text-sm text-foreground/60">0{index + 1}</span>
              <h3 className="font-serif text-4xl sm:text-5xl flex gap-2 items-center justify-between">
                {capability.name}
                <span className="sm:hidden grid text-lg size-12 place-items-center rounded-full border border-foreground/20 transition group-hover:bg-[#602329] group-hover:text-white">
                  <FiArrowUpRight aria-hidden="true" />
                </span>
              </h3>
              <p className="max-w-md leading-7 text-foreground/65">
                {capability.text}
              </p>
              <span className="hidden sm:grid size-12 place-items-center rounded-full border border-foreground/20 transition group-hover:bg-[#602329] group-hover:text-white">
                <FiArrowUpRight aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

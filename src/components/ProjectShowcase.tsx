"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import projects from "@/constants/projects.json";

const DISPLAY_TIME = 7000;

export default function ProjectShowcase() {
  const [active, setActive] = useState(0);
  const project = projects[active];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % projects.length);
    }, DISPLAY_TIME);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-[30rem] overflow-hidden lg:min-h-full">
      <div key={project.name} className="absolute inset-0 project-image-enter">
        <Image
          src={project.image}
          alt={`${project.name} project preview`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 64vw"
          className="object-cover"
        />
      </div>

      <article className="absolute bottom-5 left-3 right-3 z-10 grid grid-cols-[1fr_auto] border-b-4 border-[#602329] items-stretch gap-0 rounded-[1rem] bg-white shadow-[0_16px_50px_rgba(0,0,0,0.18)] sm:bottom-8 sm:left-6 sm:right-6 lg:bottom-8 lg:left-[-1.25rem] lg:right-8">
        <div key={`${project.name}-content`} className="min-w-0 px-5 py-5 project-card-enter sm:px-7 sm:py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/55">{project.category}</p>
          <h2 className="mt-3 text-2xl font-semibold leading-none tracking-[-0.04em] sm:text-3xl">{project.name}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-black/65">{project.summary}</p>
        </div>
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${project.name} project`}
          className="group flex min-w-20 items-center justify-center border-l border-black/10 px-3 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#602329] sm:min-w-24"
        >
          <span className="relative grid size-14 place-items-center rounded-full bg-[#602329] text-white transition-transform group-hover:scale-105">
            <svg key={`timer-${active}`} className="absolute inset-0 size-full -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
              <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              <circle className="project-timer" cx="28" cy="28" r="26" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" pathLength="100" />
            </svg>
            <FiArrowUpRight className="relative text-xl" aria-hidden="true" />
          </span>
        </a>
      </article>
    </div>
  );
}

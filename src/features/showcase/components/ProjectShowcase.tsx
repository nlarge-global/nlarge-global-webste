"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FiArrowUpRight, FiPause, FiPlay } from "react-icons/fi";
import projects from "@/content/projects.json";

const DISPLAY_TIME = 7000;

export default function ProjectShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const project = projects[active];

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
      setActive((current) => (current + 1) % projects.length);
    }, DISPLAY_TIME);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  return (
    <div className="relative flex min-h-[32rem] flex-col overflow-hidden rounded-[1.5rem] bg-[#f3f1ed] lg:min-h-full">
      <div className="flex items-center justify-between px-5 pt-5 sm:px-7 sm:pt-6">
        <div className="flex items-center gap-2" aria-label="Choose project">
          {projects.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show ${item.name}`}
              aria-current={active === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-[width,background-color] ${active === index ? "w-8 bg-[#602329]" : "w-4 bg-black/20 hover:bg-black/40"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          aria-label={paused ? "Play project carousel" : "Pause project carousel"}
          className="grid size-11 place-items-center rounded-full border border-black/10 bg-white text-black shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
        >
          {paused || reducedMotion ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}
        </button>
      </div>

      <div key={project.name} className="relative min-h-[18rem] flex-1 px-4 pb-4 pt-5 project-image-enter sm:px-7">
        <Image
          src={project.image}
          alt={`${project.name} project preview`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 64vw"
          className="object-contain object-center p-2"
        />
      </div>

      <article key={`${project.name}-content`} className="m-3 grid grid-cols-[1fr_auto] items-center rounded-[1.25rem] bg-white p-5 shadow-[0_12px_35px_rgba(40,31,29,0.09)] project-card-enter sm:m-5 sm:p-6 lg:m-4">
        <div className="min-w-0 pr-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#602329]">
            {project.category}
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.035em] sm:text-2xl">
            {project.name}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/65">
            {project.summary}
          </p>
        </div>
        {project.url === "#" ? (
          <span className="grid size-14 place-items-center rounded-full bg-black/10 text-black/40" aria-label="Project link unavailable">
            <FiArrowUpRight className="text-xl" aria-hidden="true" />
          </span>
        ) : (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${project.name} project`}
            className="group relative grid size-14 place-items-center rounded-full bg-[#602329] text-white shadow-[0_8px_20px_rgba(96,35,41,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
          >
            <svg key={`timer-${active}`} className="absolute inset-0 size-full -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
              <circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              <circle
                className={`project-timer${paused || reducedMotion ? " is-paused" : ""}`}
                cx="28"
                cy="28"
                r="26"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                pathLength="100"
              />
            </svg>
            <FiArrowUpRight className="relative text-xl transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        )}
      </article>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { FiArrowUpRight } from "react-icons/fi";

const projectLinks = {
  website: "#website-url-placeholder",
  dashboard: "#dashboard-url-placeholder",
  brand: "#brand-url-placeholder",
};

const projectNames = {
  website: "Website",
  dashboard: "Dashboard",
  brand: "Brand",
};

export default function DeviceShowcase() {
  const [activeScreen, setActiveScreen] = useState<keyof typeof projectLinks | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cursorRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, []);

  function moveCursor(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    const screen =
      x >= 78 && x <= 93 && y >= 50 && y <= 92
        ? "brand"
        : x >= 8 && x <= 33 && y >= 37 && y <= 89
          ? "dashboard"
          : x >= 25 && x <= 84 && y >= 22 && y <= 76
            ? "website"
            : null;

    setActiveScreen((current) => current === screen ? current : screen);
    const cursor = cursorRef.current;
    if (screen && cursor) {
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const inset = 12;
      const halfWidth = cursor.offsetWidth / 2 + inset;
      const halfHeight = cursor.offsetHeight / 2 + inset;
      cursor.style.setProperty("left", `${Math.min(Math.max(x, halfWidth), bounds.width - halfWidth)}px`);
      cursor.style.setProperty("top", `${Math.min(Math.max(y, halfHeight), bounds.height - halfHeight)}px`);
    }
  }

  const href = activeScreen ? projectLinks[activeScreen] : projectLinks.website;

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden bg-white lg:h-full lg:aspect-auto">
      <div
        className="absolute inset-x-0 top-1/2 aspect-[3/2] -translate-y-1/2"
        onPointerMove={moveCursor}
        onPointerLeave={() => setActiveScreen(null)}
      >
        <Image
          src="/images/device-mockup-preview.webp"
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 1023px) 100vw, 58vw"
          unoptimized
          className={`pointer-events-none object-contain transition-opacity duration-200 ${
            imageLoaded ? "opacity-0" : "opacity-100"
          }`}
        />
        <Image
          src="/images/device-mockup1.svg"
          alt="Laptop, tablet, and phone mockups showing a school website, school management dashboard, and fitness app"
          fill
          sizes="(max-width: 1023px) 100vw, 58vw"
          loading="eager"
          ref={imageRef}
          onLoad={() => setImageLoaded(true)}
          className={`pointer-events-none object-contain transition-opacity duration-200 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        <a
          ref={cursorRef}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${projectNames[activeScreen ?? "website"]} project`}
          onClick={(event) => {
            if (href.startsWith("#")) event.preventDefault();
          }}
          className={`absolute z-40 inline-flex min-w-max -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#602329] px-3 py-2 text-xs font-semibold text-white transition-opacity duration-150 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329] motion-reduce:transition-none sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${
            activeScreen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{ left: "50%", top: "50%" }}
        >
          <span>View {projectNames[activeScreen ?? "website"]}</span>
          <FiArrowUpRight className="shrink-0 text-base sm:text-lg" aria-hidden="true" />
        </a>
        <span className="absolute left-1/2 top-[15%] z-30 hidden -translate-x-1/2 whitespace-nowrap text-[clamp(1rem,2.2vw,1.875rem)] font-semibold leading-none tracking-[-0.04em] text-[#602329] lg:block">
          Websites
        </span>
        <span className="absolute left-[9%] top-[30%] z-30 hidden -rotate-12 whitespace-nowrap text-[clamp(1rem,2.2vw,1.875rem)] font-semibold leading-none tracking-[-0.04em] text-[#602329] lg:block">
          Dashboards
        </span>
        <span className="absolute left-[68%] bottom-[15%] z-30 hidden rotate-6 whitespace-nowrap text-[clamp(1rem,2.2vw,1.875rem)] font-semibold leading-none tracking-[-0.04em] text-[#602329] lg:block">
          Brand
        </span>
      </div>
    </div>
  );
}

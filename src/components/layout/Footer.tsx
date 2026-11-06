"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="top"
      tabIndex={-1}
      className="w-full px-5 pb-7 pt-14 text-black sm:px-8 lg:px-12 lg:pb-9 lg:pt-20"
    >
      <div className="grid overflow-hidden border-y border-black lg:grid-cols-[0.58fr_1.42fr]">
        <div className="flex flex-col justify-between border-b border-black py-8 lg:border-b-0 lg:border-r lg:py-10 lg:pr-10">
          <div className="flex items-end ">
            <Link
              href="/"
              aria-label="NLarge Global home"
              className="relative block h-20 w-28 shrink-0 sm:h-24 sm:w-32 lg:h-28 lg:w-36 self-start"
            >
              <Image
                src="/logo-transparent.png"
                alt="NLarge Global"
                fill
                sizes="(max-width: 640px) 112px, 144px"
                className="object-contain object-left"
                priority
              />
            </Link>

            <div className="min-w-0 self-end">
              <p className="select-none whitespace-nowrap text-[clamp(3.8rem,14vw,5rem)] font-semibold leading-[0.78] tracking-[-0.075em] sm:text-[clamp(4rem,9vw,6.5rem)] lg:text-[clamp(4rem,7vw,7rem)]">
                NLarge<span className="text-[#602329]">.</span>
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-[#602329] sm:ml-1 sm:text-base lg:text-2xl">
                Global
              </p>
            </div>
          </div>
          <div className="mt-10 sm:mt-12">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#602329]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-4 shrink-0 text-[#602329]"
              >
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              Bengaluru, India
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-black/60">
              Build · Improve · Own
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_auto]">
          <div className="min-w-0 py-8 sm:py-10 sm:pr-10 lg:pl-12">
            <p className="max-w-[12ch] text-[clamp(2.8rem,11vw,4.5rem)] leading-[0.86] tracking-[-0.06em] sm:text-[clamp(3rem,6.7vw,6.5rem)]">
              Have something in mind?
            </p>
            <a
              href="mailto:info@nlargecorp.com"
              className="mt-8 inline-flex items-center gap-3 border-b border-[#602329] pb-1 text-base font-semibold text-[#602329] sm:text-lg"
            >
              info@nlargecorp.com <span aria-hidden="true">↗</span>
            </a>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex min-w-44 gap-4 flex-col justify-between border-t border-black py-5 sm:border-l sm:border-t-0 sm:px-8 sm:py-10"
          >
            <div className="flex sm:flex-col gap-2 sm:gap-3">
              <Link
                href="/#services"
                className=" text-base hover:text-[#602329]"
              >
                Services
              </Link>
              <Link
                href="/products"
                className=" text-base hover:text-[#602329]"
              >
                Products
              </Link>
              <Link href="/contact" className="text-base hover:text-[#602329]">
                Contact
              </Link>
            </div>
            <div className="flex sm:flex-col gap-2 sm:gap-3 ">
              <Link
                href="/sitemap.xml"
                className="text-sm text-black/60 hover:text-black"
              >
                Sitemap
              </Link>
              <Link
                href="/privacy-policy"
                className="text-sm text-black/60 hover:text-black"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className=" text-sm text-black/60 hover:text-black"
              >
                Terms of Service
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-5 text-xs text-black/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} NLarge Global. All rights reserved.</p>
        <button
          type="button"
          onClick={() => {
            document.getElementById("top")?.focus({ preventScroll: true });
            window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          }}
          className="w-fit cursor-pointer font-semibold text-black hover:text-[#602329]"
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}

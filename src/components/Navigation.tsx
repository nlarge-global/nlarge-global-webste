"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border border-black/10 bg-white px-3 shadow-[0_12px_40px_rgba(0,0,0,0.10)] sm:px-4"
      >
        <Link href="/" aria-label="NLarge Global home" className="flex min-w-0 items-center">
          <span className="relative block h-12 w-16 shrink-0">
            <Image src="/logo-transparent.png" alt="" fill sizes="96px" priority className="object-contain object-left" />
          </span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-lg font-bold sm:text-xl">NLarge</span>
            <span className="-mt-2 text-sm font-medium text-black/55 sm:text-sm">Global</span>
          </div>
        </Link>
        <div className="hidden items-center gap-7 lg:flex">
          <Link href="/#services" className="text-sm font-semibold transition-colors hover:text-[#602329]">Services</Link>
          <Link href="/products" className="text-sm font-semibold transition-colors hover:text-[#602329]">Products</Link>
          <Link href="/contact" className="rounded-full bg-[#602329] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black">Let’s talk</Link>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
          className="grid size-11 place-items-center rounded-full border border-black/15 transition-colors hover:bg-black hover:text-white lg:hidden"
        >
          {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>
      </nav>
      {open && (
        <div id="mobile-navigation" className="mx-auto mt-2 max-w-3xl rounded-[1.5rem] border border-black/10 bg-white px-5 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.10)] lg:hidden">
          <div className="flex flex-col gap-5 text-lg font-semibold">
            <Link href="/services" onClick={() => setOpen(false)}>Services</Link>
            <Link href="/products" onClick={() => setOpen(false)}>Products</Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="w-fit rounded-full bg-[#602329] px-5 py-3 text-white">Let’s talk</Link>
          </div>
        </div>
      )}
    </header>
  );
}

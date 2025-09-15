"use client";

// import { motion } from "framer-motion"
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }else{
      router.push(`/#${sectionId}`)
    }
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 nav-animate ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md border-b border-foreground/10"
          : ""
      }`}
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="cursor-pointer nav-logo focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 size-16">
            <Link href="/" aria-label="NLarge Home">
              <Image
                src={"/logo.png"}
                alt="logo"
                height={500}
                width={500}
                quality={100}
                className=" bg-blend-multiply"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-12">
            <button
              onClick={() => scrollToSection("about")}
              className="mb-0 text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors nav-animate focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
              aria-label="Scroll to About section"
            >
              About us
            </button>

            <div className="nav-animate">
              <Link
                href="/services"
                className=" text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
                aria-label="View Services"
              >
                Services
              </Link>
            </div>
            <div className="nav-animate">
              <Link
                href="/products"
                className=" text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
                aria-label="View Products"
              >
                Products
              </Link>
            </div>

            <button
              onClick={() => scrollToSection("contact")}
              className=" text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors nav-animate focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
              aria-label="Scroll to Contact section"
            >
              Contact
            </button>
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden flex items-center">
            <button
              aria-label="Open mobile menu"
              className="focus:outline-none"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect y="6" width="28" height="2" rx="1" fill="#2c2c2c" />
                <rect y="13" width="28" height="2" rx="1" fill="#2c2c2c" />
                <rect y="20" width="28" height="2" rx="1" fill="#2c2c2c" />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-4 bg-background/95 rounded-lg shadow-lg p-6 flex flex-col items-center space-y-4">
            <button
              onClick={() => { scrollToSection("about"); setMobileOpen(false); }}
              className="w-full text-center text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors nav-animate focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
              aria-label="Scroll to About section"
            >
              About us
            </button>
            <Link
              href="/services"
              className="w-full text-center text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
              aria-label="View Services"
              onClick={() => setMobileOpen(false)}
            >
              Services
            </Link>
            <Link
              href="/products"
              className="w-full text-center text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
              aria-label="View Products"
              onClick={() => setMobileOpen(false)}
            >
              Products
            </Link>
            <button
              onClick={() => { scrollToSection("contact"); setMobileOpen(false); }}
              className="w-full text-center text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors nav-animate focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
              aria-label="Scroll to Contact section"
            >
              Contact
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

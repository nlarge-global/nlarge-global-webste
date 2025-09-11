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

          <div className="hidden md:flex items-center space-x-12">
            <button
              onClick={() => scrollToSection("about")}
              className=" text-xs tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors nav-animate focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer hover:font-semibold"
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
        </div>
      </div>
    </nav>
  );
}

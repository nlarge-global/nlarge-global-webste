"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? "bg-background/90 backdrop-blur-md border-b border-foreground/10" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="font-serif text-2xl font-light text-foreground cursor-pointer"
          >
            <Link href="/">N</Link>
          </motion.div>

          <div className="hidden md:flex items-center space-x-12">
            <motion.button
              onClick={() => scrollToSection("about")}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -2 }}
              className="font-sans text-sm tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors"
            >
              About
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -2 }}
            >
              <Link
                href="/products"
                className="font-sans text-sm tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors"
              >
                Products
              </Link>
            </motion.div>

            <motion.button
              onClick={() => scrollToSection("contact")}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -2 }}
              className="font-sans text-sm tracking-wide uppercase text-foreground/70 hover:text-foreground transition-colors"
            >
              Contact
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

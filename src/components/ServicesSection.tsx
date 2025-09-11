"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ServicesSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.77, 0, 0.175, 1] }}
      className="py-24 md:py-40 bg-background/60 border-t border-foreground/10 flex items-center justify-center"
      aria-label="Services"
    >
      <div className="max-w-3xl w-full mx-auto text-center flex flex-col items-center gap-8">
        <h2 className="font-display text-6xl md:text-8xl font-extrabold text-foreground mb-4 tracking-tight leading-tight">
          Our Services
        </h2>
        <p className=" text-xl md:text-2xl text-foreground/70 mb-8 max-w-xl mx-auto">
          Discover how NLarge Global can help you build, scale, and transform your
          business with world-class technology and design.
        </p>
        <Link href="/services">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className=" text-lg md:text-xl px-8 py-4 border border-foreground bg-background text-foreground shadow-lg hover:bg-foreground hover:text-background transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 cursor-pointer"
            aria-label="View All Services"
          >
            View All Services
          </motion.button>
        </Link>
      </div>
    </motion.section>
  );
}

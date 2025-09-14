"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export default function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section
      ref={ref}
      className="relative h-screen flex items-center justify-center overflow-hidden"
      aria-label="Hero section"
      role="banner"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"
        style={{ y: backgroundY }}
        aria-hidden="true"
      />

      <motion.div
        className="absolute top-1/4 left-1/4 w-px h-32 bg-foreground/30"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 2, delay: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute bottom-1/3 right-1/3 w-32 h-px bg-foreground/10"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, delay: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 text-center px-6"
        style={{ y: textY, opacity }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.77, 0, 0.175, 1],
            delay: 0.2,
          }}
          className="font-serif text-8xl md:text-[12rem]  text-foreground leading-none relative"
          aria-label="NLarge Global - Company Name"
        >
          NLarge
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 1.1,
              ease: [0.77, 0, 0.175, 1],
            }}
            className="block text-2xl md:text-6xl  text-foreground mt-2 absolute -bottom-8 -right-27"
            aria-label="Global"
          >
            Global
          </motion.span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-8"
        >
          <motion.p
            className="font-serif text-lg tracking-[0.2em] uppercase text-foreground/80"
            initial={{ letterSpacing: "0.1em" }}
            animate={{ letterSpacing: "0.2em" }}
            transition={{ duration: 2, delay: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
            role="text"
            aria-label="Company tagline"
          >
            Timeless Software Excellence
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
          aria-hidden="true"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-px h-8 bg-foreground/30"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

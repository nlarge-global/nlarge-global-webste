"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

export default function ContactSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section
      id="contact"
      ref={ref}
  className="min-h-[70vh] sm:min-h-screen flex items-center py-16 sm:py-32 relative overflow-hidden"
    >
      <motion.div
        className="absolute top-1/3 left-8 w-24 h-px bg-foreground/5"
        style={{ y: useTransform(scrollYProgress, [0, 1], ["30%", "-30%"]) }}
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.5 }}
      />

  <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
        <motion.div
          style={{ y }}
          initial={{ opacity: 0, y: 100 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.h2 className="font-serif text-4xl sm:text-6xl md:text-8xl text-foreground mb-10 sm:mb-16">
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 1,
                delay: 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              Let's Create
            </motion.span>
            <br />
            <motion.em
              className=""
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 1,
                delay: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              Together
            </motion.em>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <Link href={'/contact'}>
              <motion.button
                whileTap={{ scale: 0.65 }}
                transition={{
                  duration: 0.3,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className=" text-xs sm:text-sm tracking-[0.2em] uppercase border border-foreground px-6 sm:px-12 py-3 sm:py-4 text-foreground transition-all duration-200 relative overflow-hidden group cursor-pointer hover:bg-black hover:text-white"
              >
                Get in Touch
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

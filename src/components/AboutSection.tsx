"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

export default function AboutSection() {
  const ref = useRef(null)
  return (
    <section id="about" ref={ref} className="min-h-screen flex items-center py-32 relative overflow-hidden">
      <motion.div
        className="absolute top-1/2 right-12 w-px h-24 bg-foreground/5"
      />

      <div className="max-w-4xl mx-auto px-8">
        <motion.div
          className="text-center"
        >
          <motion.h2 className="font-serif text-6xl md:text-8xl text-foreground mb-16 leading-tight">
            <motion.span
            >
              Crafted with
            </motion.span>
            <br />
            <motion.em
              className="font-sans font-light"
            >
              Precision
            </motion.em>
          </motion.h2>

          <motion.p
            className=" text-lg leading-relaxed text-foreground/80 max-w-2xl mx-auto"
          >
            Since our founding, we have dedicated ourselves to creating software that transcends trends. Each solution
            is meticulously crafted to embody both elegance and functionality.
          </motion.p>

          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "10rem" }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-px bg-foreground/20 mx-auto mt-12"
          />
        </motion.div>
      </div>
    </section>
  )
}

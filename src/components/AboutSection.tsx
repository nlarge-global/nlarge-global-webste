"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

export default function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <section id="about" ref={ref} className="min-h-screen flex items-center py-32 relative overflow-hidden">
      <motion.div
        className="absolute top-1/2 right-12 w-px h-24 bg-foreground/5"
        style={{ y: useTransform(scrollYProgress, [0, 1], ["-50%", "50%"]) }}
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: 1.5, delay: 0.8 }}
      />

      <div className="max-w-4xl mx-auto px-8">
        <motion.div
          style={{ y, opacity }}
          initial={{ opacity: 0, y: 100 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center"
        >
          <motion.h2 className="font-serif text-6xl md:text-8xl font-light text-foreground mb-16 leading-tight">
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Crafted with
            </motion.span>
            <br />
            <motion.em
              className="font-light"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Precision
            </motion.em>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-sans text-lg leading-relaxed text-foreground/80 max-w-2xl mx-auto"
          >
            Since our founding, we have dedicated ourselves to creating software that transcends trends. Each solution
            is meticulously crafted to embody both elegance and functionality.
          </motion.p>

          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: "4rem" } : {}}
            transition={{ duration: 1.5, delay: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-px bg-foreground/20 mx-auto mt-12"
          />
        </motion.div>
      </div>
    </section>
  )
}

"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

export default function ProductsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"])

  return (
    <section ref={ref} className="min-h-screen py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-32"
        >
          <motion.h1
            className="font-serif text-8xl md:text-[10rem] font-light text-foreground mb-8 leading-none"
            style={{ y }}
          >
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Our
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Craft
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="font-sans text-lg tracking-wide uppercase text-foreground/70 max-w-2xl mx-auto"
          >
            Sophisticated solutions designed with precision and elegance
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h2 className="font-serif text-6xl font-light text-foreground mb-8">Pravli</h2>
            <p className="font-sans text-base text-foreground/70 leading-relaxed mb-8">
              A revolutionary restaurant management system that transforms how culinary establishments operate. Pravli
              combines intuitive design with powerful functionality, creating an experience that feels as refined as the
              establishments it serves.
            </p>

            <div className="space-y-4 mb-8">
              {["Elegant Interface Design", "Real-time Analytics", "Seamless Integration"].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-1 h-1 bg-foreground/40" />
                  <span className="font-sans text-sm text-foreground/60">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 1.2 }}
              whileHover={{
                scale: 1.02,
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
              }}
              className="font-sans text-sm tracking-wide uppercase border border-foreground px-8 py-3 text-foreground transition-all duration-300"
            >
              Learn More
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative group"
          >
            <div className="aspect-[4/3] bg-background border border-foreground/20 overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-background/50"
              >
                <span className="font-serif text-2xl text-foreground/40">Preview Coming Soon</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center"
        >
          <h3 className="font-serif text-4xl font-light text-foreground mb-12">Future Innovations</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl mx-auto">
            {[
              {
                title: "Atelier",
                description: "Creative workspace management for design studios and agencies",
                status: "In Development",
              },
              {
                title: "Meridian",
                description: "Enterprise resource planning with timeless elegance",
                status: "Conceptual",
              },
            ].map((product, index) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, delay: 1 + index * 0.2 }}
                className="text-center"
              >
                <h4 className="font-serif text-2xl font-light text-foreground mb-4">{product.title}</h4>
                <p className="font-sans text-sm text-foreground/60 mb-3">{product.description}</p>
                <span className="font-sans text-xs tracking-wide uppercase text-foreground/40">{product.status}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

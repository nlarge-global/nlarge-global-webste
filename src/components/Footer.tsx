"use client"

import { motion } from "framer-motion"

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true }}
      className="border-t border-foreground/10 py-16 px-6"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-display text-2xl font-light mb-4">NLarge Global</h3>
            <p className="text-foreground/60 text-sm leading-relaxed">
              Crafting exceptional software solutions with timeless elegance and precision.
            </p>
          </div>

          <div>
            <h4 className="font-sans text-sm font-medium tracking-wider uppercase mb-4">Connect</h4>
            <div className="space-y-2">
              <p className="text-foreground/60 text-sm">hello@nlargeglobal.com</p>
              <p className="text-foreground/60 text-sm">+1 (555) 123-4567</p>
            </div>
          </div>

          <div>
            <h4 className="font-sans text-sm font-medium tracking-wider uppercase mb-4">Location</h4>
            <p className="text-foreground/60 text-sm leading-relaxed">
              New York, NY
              <br />
              United States
            </p>
          </div>
        </div>

        <div className="border-t border-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-foreground/40 text-xs">© 2024 NLarge Global. All rights reserved.</p>
          <p className="text-foreground/40 text-xs mt-4 md:mt-0">Crafted with precision and care.</p>
        </div>
      </div>
    </motion.footer>
  )
}

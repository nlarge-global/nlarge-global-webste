"use client"

import { motion } from "framer-motion"

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
  className="fixed inset-0 bg-white z-50 flex items-center justify-center px-4"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl sm:text-4xl md:text-6xl tracking-wider text-foreground">NLarge Global</h1>
          <p className=" text-xs sm:text-sm tracking-[0.2em] text-foreground/60 mt-2 uppercase">Crafting Excellence</p>
        </motion.div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
          className="h-px bg-foreground/20 mx-auto max-w-xs"
        />
      </div>
    </motion.div>
  )
}

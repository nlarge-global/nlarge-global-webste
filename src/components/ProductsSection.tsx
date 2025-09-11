"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiExternalLink } from "react-icons/fi";

export default function ProductsSection() {
  return (
    <>
      <HeroProductSection />
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center mb-16 md:mb-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{
            duration: 1.2,
            delay: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <h2 className="font-serif text-6xl  text-foreground mb-8">
            Pravli
          </h2>
          <p className="font-sans text-base text-foreground/70 leading-relaxed mb-8">
            A revolutionary restaurant management system that transforms how
            culinary establishments operate. Pravli combines intuitive design
            with powerful functionality, creating an experience that feels as
            refined as the establishments it serves.
          </p>

          <motion.ul
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="list-disc list-inside mb-8 space-y-2"
          >
            {[
              "Elegant Interface Design",
              "Real-time Analytics",
              "Seamless Integration",
            ].map((feature, index) => (
              <li className="" key={feature}>
                <span className=" text-sm text-foreground/60">
                  {feature}
                </span>
              </li>
            ))}
          </motion.ul>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className=" text-sm tracking-wide uppercase border border-foreground px-8 py-3 text-foreground transition-all duration-200 cursor-pointer hover:bg-black hover:text-white flex items-center gap-2"
          >
            Visit
            <FiExternalLink />
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.5,
            delay: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="relative group"
        >
          <div className="aspect-[4/3] bg-background border border-foreground/20 overflow-hidden">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-background/50"
            >
              <span className="font-serif text-2xl text-foreground/40">
                Preview Coming Soon
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 1.2,
          delay: 0.8,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="text-center min-h-screen flex flex-col items-center justify-center "
      >
        <h3 className=" text-4xl  text-foreground mb-12">
          Future Innovations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16 max-w-4xl mx-auto">
          {[
            {
              title: "Atelier",
              description:
                "Creative workspace management for design studios and agencies",
              status: "In Development",
            },
            {
              title: "Meridian",
              description:
                "Enterprise resource planning with timeless elegance",
              status: "Conceptual",
            },
          ].map((product, index) => (
            <motion.div
              key={product.title}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 + index * 0.2 }}
              className="text-center"
            >
              <h4 className=" text-2xl  text-foreground mb-4">
                {product.title}
              </h4>
              <p className=" text-sm text-foreground/60 mb-3">
                {product.description}
              </p>
              <span className=" text-xs tracking-wide uppercase text-foreground/40">
                {product.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </>
  );
}

function HeroProductSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="text-center h-screen flex flex-col items-center justify-center mb-32 md:mb-48 relative"
    >
      <motion.h1 className="font-serif text-8xl md:text-[10rem]  text-foreground mb-8 leading-none">
        <motion.span
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            delay: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          Our
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            delay: 0.5,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          Craft
        </motion.span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className=" text-lg tracking-wide uppercase text-foreground/70 max-w-2xl mx-auto"
      >
        Sophisticated solutions designed with precision and elegance
      </motion.p>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="flex flex-col items-center"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 22V10M16 22L10 16M16 22L22 16"
              stroke="#2c2c2c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="mt-2 text-xs text-[#2c2c2c]/60 ">
            Scroll Down
          </span>
        </motion.div>
      </div>
    </motion.section>
  );
}

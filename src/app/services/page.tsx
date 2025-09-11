"use client";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const services = [
  {
    number: "01",
    title: "Digital Excellence",
    subtitle: "Web & Mobile Development",
    description:
      "Crafting bespoke digital experiences that seamlessly blend aesthetic sophistication with cutting-edge functionality, delivering unparalleled user journeys across all platforms.",
    features: [
      "Artisanal web and application development",
      "Responsive design mastery for every device",
      "Luxury e-commerce and marketplace solutions",
      "White-glove support and maintenance",
    ],
    accent: "Development",
  },
  {
    number: "02",
    title: "Infrastructure Mastery",
    subtitle: "Cloud & Infrastructure Management",
    description:
      "Orchestrating robust cloud ecosystems with meticulous attention to security, scalability, and performance optimization, ensuring your digital assets operate at peak excellence.",
    features: [
      "Seamless cloud migration and deployment",
      "Architectural excellence and scalability",
      "Enterprise-grade security solutions",
      "Round-the-clock monitoring and support",
    ],
    accent: "Infrastructure",
  },
  {
    number: "03",
    title: "Bespoke Solutions",
    subtitle: "Custom Software Development",
    description:
      "Engineering tailored software solutions that perfectly align with your unique business vision, automating complex workflows while maintaining the highest standards of craftsmanship.",
    features: [
      "Enterprise resource planning systems",
      "Customer relationship management platforms",
      "Proprietary tools and seamless integrations",
      "Advanced analytics and business intelligence",
    ],
    accent: "Solutions",
  },
];

export default function ServicesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={containerRef}
      className="min-h-screen  relative overflow-hidden scroll-snap-main"
    >
      <Navigation />
      <motion.section
        className="relative text-center min-h-screen flex flex-col justify-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.77, 0, 0.175, 1] }}
      >
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="font-serif text-6xl md:text-8xl font-light   mb-6 tracking-tight">
            Our Services
          </h1>
          <div className="w-24 h-px  mx-auto mb-8" />
          <p className=" text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto">
            Elevating businesses through meticulously crafted digital solutions
          </p>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => {
              containerRef.current?.scrollBy({
                top: window.innerHeight,
                behavior: "smooth",
              });
            }}
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

      {services.map((service, idx) => {
        const isEven = idx % 2 === 0;

        return (
          <motion.section
            key={service.title}
            className="relative py-24 md:py-32 px-4 border-t border-[#2c2c2c]/10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: idx * 0.1 }}
          >
            <div className="max-w-7xl mx-auto">
              <div
                className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${
                  isEven ? "" : "lg:grid-flow-col-dense"
                }`}
              >
                <motion.div
                  className={`space-y-8 ${isEven ? "" : "lg:col-start-2"}`}
                  initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2,
                    ease: [0.77, 0, 0.175, 1],
                  }}
                >
                  <div className="space-y-4">
                    <motion.span
                      className=" text-[#2c2c2c]/40 text-lg tracking-widest"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      {service.number}
                    </motion.span>

                    <motion.h2
                      className=" text-4xl md:text-6xl font-serif  text-[#2c2c2c] leading-tight"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      {service.title}
                    </motion.h2>

                    <motion.h3
                      className="font-light text-xl md:text-2xl  "
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      {service.subtitle}
                    </motion.h3>
                  </div>

                  <motion.div
                    className="w-16 h-px "
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  />

                  <motion.p
                    className=" text-lg md:text-xl leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    {service.description}
                  </motion.p>

                  <motion.ul
                    className="space-y-1 list-disc list-inside"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    {service.features.map((feature, featureIdx) => (
                      <li
                        key={feature}
                        className=" text-base md:text-lg list-item"
                      >
                        {feature}
                      </li>
                    ))}
                  </motion.ul>
                </motion.div>

                <motion.div
                  className={`relative ${
                    isEven ? "" : "lg:col-start-1 lg:row-start-1"
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3,
                    ease: [0.77, 0, 0.175, 1],
                  }}
                >
                  <div className="relative aspect-square max-w-md mx-auto">
                    {/* Elegant geometric background */}
                    <div className="absolute inset-0 border border-[#2c2c2c]/20 rounded-full" />
                    <div className="absolute inset-4 border border-[#2c2c2c]/10 rounded-full" />

                    {/* Central accent text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        className="font-serif text-6xl font-light   text-[#2c2c2c]/40 select-none"
                        initial={{ opacity: 0, rotate: -10 }}
                        whileInView={{ opacity: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }}
                      >
                        {service.accent}
                      </motion.span>
                    </div>

                    {/* Subtle floating elements */}
                    <motion.div
                      className="absolute top-8 right-8 w-2 h-2 rounded-full bg-black"
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: idx * 0.5,
                      }}
                    />
                    <motion.div
                      className="absolute bottom-12 left-12 w-1 h-1 bg-black  rounded-full"
                      animate={{
                        y: [0, 8, 0],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: idx * 0.7,
                      }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>
        );
      })}

      <section>
        <Footer />
      </section>
    </div>
  );
}

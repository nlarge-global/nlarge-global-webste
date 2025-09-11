"use client";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import Navigation from "@/components/Navigation";
import ServicesSection from "@/components/ServicesSection";
import TeamSection from "@/components/TeamSection";
import { motion } from "framer-motion";
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white scroll-snap-container">
      <Navigation />
      <main className="scroll-snap-main">
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <TeamSection />
        <ContactSection />
        <motion.section
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.77, 0, 0.175, 1] }}
        >
          <Footer />
        </motion.section>
      </main>
    </div>
  );
}

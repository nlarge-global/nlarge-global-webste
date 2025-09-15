import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-foreground/10 p-6 h-screen flex flex-col justify-end bg-background">
      <div className="max-w-6xl mx-auto w-full flex flex-col justify-end h-full">
        <div className="flex flex-col justify-between items-start gap-12 pb-12">
          <div className="flex flex-col md:flex-row items-end w-full gap-12">
            <div className="cursor-pointer relative h-full size-28">
              <Link href="/" aria-label="NLarge Home">
                <Image
                  src={"/logo.png"}
                  alt="logo"
                  height={500}
                  width={500}
                  quality={100}
                  className=" bg-blend-multiply"
                />
              </Link>
            </div>
            <div className="mb-8 md:mb-0">
              <h3 className="font-display text-3xl font-serif  mb-4">
                NLarge Global
              </h3>
              <p className="text-foreground/60 text-base leading-relaxed">
                Building elegant SaaS products and platforms for a global
                audience.
                <br />
                Future: NLarge Softwares, Systems, Communications, and more.
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between w-full gap-12">
            <div className="mb-8 md:mb-0">
              <h4 className=" text-base font-medium tracking-wider uppercase mb-4">
                Connect
              </h4>
              <div className="space-y-2">
                <p className="text-foreground/60 text-base">
                  info@nlargecorp.com
                </p>
                <p className="text-foreground/60 text-base">
                  support@nlargecorp.com
                </p>
              </div>
            </div>
            <div>
              <h4 className=" text-base font-medium tracking-wider uppercase mb-4">
                Location
              </h4>
              <p className="text-foreground/60 text-base leading-relaxed">
                Headquarters: Unknown
                <br />
                Working Remotely
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-foreground/40 text-sm">
              © {new Date().getFullYear()} NLarge Global. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm">
              <Link
                href="/privacy-policy"
                className="text-foreground/40 hover:text-foreground/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"
                aria-label="View Privacy Policy"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-foreground/40 hover:text-foreground/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50"
                aria-label="View Terms of Service"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <p className="text-foreground/40 text-sm mt-4 md:mt-0">
            Crafted with precision and care.
          </p>
        </div>
      </div>
    </footer>
  );
}

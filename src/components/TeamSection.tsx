"use client";
import { motion } from "motion/react";
import Image from "next/image";
import React from "react";

interface TeamMember {
  name: string;
  designation: string;
  img: string;
  github: string;
  linkedin: string;
}

export default function TeamSection() {
  const members: TeamMember[] = [
    {
      name: "Sahil Poonia",
      designation: "Founder & CEO",
      img: "/ceo.jpg",
      github: "https://www.github.com/sahilbishnoi156",
      linkedin: "https://www.linkedin.com/in/sahil-poonia",
    },
    {
      name: "Shiva Chahar",
      img: "/coo.jpg",
      designation: "Co-Founder & COO",
      github: "https://www.github.com/Rimaru06",
      linkedin: "https://www.linkedin.com/in/shiva-chahar-573287257",
    },
  ];
  return (
    <motion.section
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1.2, delay: 0.2, ease: [0.77, 0, 0.175, 1] }}
  className="py-10 sm:py-16 md:py-32 border-t border-foreground/10 bg-background/40"
      aria-label="Team"
    >
  <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 text-center">
  <h2 className="font-serif text-3xl sm:text-5xl md:text-7xl text-foreground mb-6 sm:mb-8 mt-16 sm:mt-24">
          Meet the Team
        </h2>
  <p className=" text-base sm:text-lg text-foreground/70 mb-8 sm:mb-12">
          Our founders and team are passionate about building elegant, impactful
          technology for a global audience.
        </p>
  <div className="flex flex-col md:flex-row justify-center items-start gap-6 sm:gap-12 mt-6 sm:mt-8">
          {members.map((member, index) => {
            return (
              <div className="w-full md:w-1/3 p-4 sm:p-8 rounded-xl bg-white/80 flex flex-col items-center" key={`${member.name}, ${member.designation} ${index}`}> 
                <Image
                  src={member.img || ""}
                  alt={member.name}
                  width={120}
                  height={120}
                  className="rounded-full shadow-lg mb-2 sm:mb-4 aspect-square object-cover"
                />
                <h3 className=" text-base sm:text-xl text-foreground mt-2 mb-1">
                  {member.name}
                </h3>
                <p className="text-foreground/60 mb-1 sm:mb-2">{member.designation}</p>
                <div className="flex gap-2 sm:gap-4 mt-2">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="text-foreground/60 hover:text-foreground transition-colors duration-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11.75 20h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm13.25 12.268h-3v-5.604c0-1.337-.026-3.059-1.865-3.059-1.865 0-2.151 1.459-2.151 2.967v5.696h-3v-11h2.881v1.507h.041c.401-.761 1.379-1.562 2.838-1.562 3.036 0 3.6 2 3.6 4.59v6.465z" />
                    </svg>
                  </a>
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub"
                    className="text-foreground/60 hover:text-foreground transition-colors duration-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.371 0 0 5.371 0 12c0 5.303 3.438 9.8 8.205 11.387.6.111.82-.261.82-.577 0-.285-.011-1.04-.017-2.04-3.338.726-4.042-1.611-4.042-1.611-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.072 1.836 2.809 1.306 3.495.998.108-.776.419-1.306.762-1.607-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.019.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.625-5.475 5.921.43.371.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .319.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.629-5.371-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

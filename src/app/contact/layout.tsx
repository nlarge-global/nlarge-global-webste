import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk with NLarge Global about a website, software product, or long-term technology partnership.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}

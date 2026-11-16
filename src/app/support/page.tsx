import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { socialPreviewImage } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support, Privacy & Data Requests",
  description: "Contact NLarge Global for website and software project support, privacy or personal-data requests, and security concerns.",
  keywords: [
    "website project support",
    "software support",
    "website maintenance support",
    "personal data request",
    "privacy request",
    "report a security concern",
  ],
  alternates: { canonical: "/support" },
  openGraph: {
    title: "Support, Privacy & Data Requests | NLarge Global",
    description:
      "Contact NLarge Global for project support, privacy and personal-data requests, project credentials, or to report a security concern.",
    url: "/support",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Support, Privacy & Data Requests | NLarge Global",
    description:
      "Contact NLarge Global for project support, privacy and personal-data requests, project credentials, or to report a security concern.",
    images: [socialPreviewImage.url],
  },
};

const sectionClass = "space-y-3";
const headingClass = "text-2xl font-semibold tracking-[-0.03em] text-black";
const linkClass = "font-semibold text-[#602329] underline underline-offset-4";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[92rem] px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28 lg:pt-40"
      >
        <header className="border-b border-black pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
            Help
          </p>
          <h1
            className="mt-5 max-w-[10ch] text-[clamp(4rem,9vw,7.5rem)] leading-[0.86] tracking-[-0.055em]"
          >
            Support
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-black/70">
            Ask us about a project, your information, or a security concern.
          </p>
        </header>

        <div className="grid gap-12 pt-12 lg:grid-cols-[0.55fr_1fr]">
          <p className="text-lg font-semibold">
            For privacy requests, tell us what you need and how to find the
            relevant information.
          </p>
          <div className="max-w-3xl space-y-10 leading-7 text-black/70">
            <section className={sectionClass}>
              <h2 className={headingClass}>Request access, correction or deletion</h2>
              <p>
                To ask us to access, correct or delete personal information, email
                <a className={linkClass} href="mailto:support@nlargecorp.com?subject=Privacy%20or%20data%20request">
                  support@nlargecorp.com
                </a>{" "}
                with your name, the email address or business associated with the
                information, and the project or record you are asking about.
                Do not include passwords, access keys, recovery codes or other
                secrets in your email. We may ask for information to verify your
                identity before acting. We will explain if we cannot complete a
                request in full or without delay because of a legal obligation, an
                active agreement, a dispute or a technical limitation.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>What if I need project credentials?</h2>
              <p>
                If you provided credentials for project work and your agreement
                allows us to retain them, contact us and tell us which project or
                system they relate to. We will confirm whether we still hold them.
                Do not send the credentials themselves by email. If credentials
                have been deleted, expired or changed, we may not be able to
                recover the earlier values.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Report a security concern</h2>
              <p>
                Email{" "}
                <a className={linkClass} href="mailto:support@nlargecorp.com?subject=Security%20concern">
                  support@nlargecorp.com
                </a>{" "}
                as soon as possible. Include the affected project or system and a
                way to contact you, but do not email passwords, keys or other
                credentials.
              </p>
              <p>
                If we confirm a personal-data breach affecting you, we will
                notify you promptly and share relevant information about the
                incident and steps you can take. We will notify regulators or
                other authorities within any deadline that applies to us. Some
                laws set a 72-hour deadline for regulator reports; affected-person
                notices can follow a different deadline.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Questions about privacy or these terms</h2>
              <p>
                For privacy questions, email{" "}
                <a className={linkClass} href="mailto:support@nlargecorp.com">
                  support@nlargecorp.com
                </a>
                . For questions about these terms or any separate written
                agreement, email{" "}
                <a className={linkClass} href="mailto:info@nlargecorp.com">
                  info@nlargecorp.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className={headingClass}>How long is information kept?</h2>
              <p>
                Retention depends on the type of information and why we hold it.
                See the{" "}
                <a className={linkClass} href="/privacy-policy">
                  Privacy Policy
                </a>{" "}
                for current details.
              </p>
            </section>

            <p>
              Read our{" "}
              <a className={linkClass} href="/privacy-policy">
                Privacy Policy
              </a>{" "}
              for more about the information we handle and how we use it.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

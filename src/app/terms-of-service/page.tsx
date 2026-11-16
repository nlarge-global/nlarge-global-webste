import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import { socialPreviewImage } from "@/lib/site";

/**
 * Legal page version record.
 *
 * Replace only by the owner of these documents. Every update must append one
 * entry to the version list below; do not edit existing entries.
 *
 * - current: true marks the active version.
 * - effective: the date this version took legal effect.
 * - change: short summary of what changed in this version.
 */
// The owner keeps this list. Add a new entry only when a new version becomes active.
const versionHistory = [
  {
    version: "1.0",
    effective: "15 November 2026",
    current: true,
    change: "Initial published version.",
  },
  {
    version: "1.1",
    effective: "TBD",
    current: false,
    change: "TBD",
  },
];

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms for using the NLarge Global website, submitting project enquiries, and understanding how separate project and product agreements apply.",
  keywords: [
    "NLarge Global terms of service",
    "website terms of use",
    "software project terms",
    "ready-made software product terms",
    "software purchase agreement",
  ],
  alternates: { canonical: "/terms-of-service" },
  openGraph: {
    title: "Terms of Service | NLarge Global",
    description:
      "Terms for using the NLarge Global website, submitting project enquiries, and understanding how separate project and product agreements apply.",
    url: "/terms-of-service",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | NLarge Global",
    description:
      "Terms for using the NLarge Global website and submitting project enquiries.",
    images: [socialPreviewImage.url],
  },
};

const sectionClass = "space-y-3";
const headingClass = "text-2xl font-semibold tracking-[-0.03em] text-black";
const linkClass = "font-semibold text-[#602329] underline underline-offset-4";

export default function TermsOfServicePage() {
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
            Legal
          </p>
          <h1
            className="mt-5 max-w-[10ch] text-[clamp(4rem,9vw,7.5rem)] leading-[0.86] tracking-[-0.055em]"
          >
            Terms of Service
          </h1>
          <p className="mt-6 text-sm text-black/60">
            Effective 15 November 2026
          </p>
        </header>

        <div className="grid gap-12 pt-12 lg:grid-cols-[0.55fr_1fr]">
          <p className="text-lg font-semibold">
            Rules for using this website and beginning a project enquiry.
          </p>
          <div className="max-w-3xl space-y-10 leading-7 text-black/70">
            <section>
              <h2 className={headingClass}>Using the website</h2>
              <p>
                You may use this website for lawful informational and business
                purposes. You must not interfere with its operation, attempt
                unauthorized access, introduce malicious code, scrape it in a way
                that disrupts service, or use its content in a manner that
                infringes our rights or another party&apos;s rights.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Website information</h2>
              <p>
                Website content describes NLarge Global&apos;s capabilities and
                available information about products and services. It is
                provided for general purposes and does not constitute a binding
                proposal, professional advice or guarantee of a result.
                Product availability and scope may change.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Project enquiries</h2>
              <p>
                Submitting an enquiry does not create an agreement or
                obligation to provide services. Any project begins only after
                the parties agree to applicable scope, timing, fees, deliverables
                and commercial terms in a separate written agreement.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Client and project information</h2>
              <p>
                If a project requires us to handle client information or
                credentials, the separate written agreement will describe the
                agreed handling, retention, return and deletion terms. Our
                <a className={linkClass} href="/privacy-policy">
                  Privacy Policy
                </a>{" "}
                explains our general handling of personal information.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Products</h2>
              <p>
                The website and products described here, including NLarge Global
                software products, are offered subject to these terms and the
                separate written agreements that govern each product or
                engagement. Product-specific ownership, licensing, support and
                service terms are described in those separate agreements, not in
                this page alone. Any product documentation, pricing, or service
                proposal you receive is part of that separate agreement once you
                accept it.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Intellectual property</h2>
              <p>
                Unless otherwise stated, the website, branding, design and
                original content are owned by or licensed to NLarge Global and
                are protected by applicable intellectual property laws.
                Project-specific ownership and licensing are governed by the
                relevant signed agreement.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Availability and liability</h2>
              <p>
                We aim to keep the website accurate and available, but do not
                guarantee uninterrupted access or that every item of information
                is complete or current. To the maximum extent permitted by law,
                NLarge Global is not liable for indirect, incidental or
                consequential losses arising from use of the website.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Third-party links</h2>
              <p>
                Links to external websites are provided for convenience. We are
                not responsible for their content, availability or practices, and
                accessing them is at your own discretion.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Changes and governing terms</h2>
              <p>
                We may update these terms at any time. Continued use after an
                update constitutes acceptance of the revised terms. Questions
                about these terms can be sent to{" "}
                <a className={linkClass} href="mailto:info@nlargecorp.com">
                  info@nlargecorp.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Governing law and dispute resolution</h2>
              <p>
                These terms are governed by the laws of the jurisdiction in
                which NLarge Global operates, without regard to its conflict of
                laws rules. Where the law of that jurisdiction does not allow
                arbitration, then any dispute arising from or relating to these
                terms must first be attempted in good faith through mediation
                before court proceedings. If that jurisdiction requires
                arbitration, then each dispute, except those involving
                allegations of fraud, theft, assault, or deliberate bodily harm,
                will be resolved by binding arbitration in the agreed venue.
                Each party may still seek urgent injunctive relief from a court
                of competent jurisdiction at any time.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Entire agreement and amendments</h2>
              <p>
                These terms, together with the separate written agreements that
                govern a specific project or product, form the entire agreement
                between you and NLarge Global about that project or product. If
                a separate written agreement and these terms conflict, the
                written agreement controls for that project or product. We may
                update these terms, but we will only change the terms that apply
                to you by giving you notice that the updated terms take effect
                on the stated date.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Changes to the website and products</h2>
              <p>
                NLarge Global may update the website, products or pricing at any
                time. We will make reasonable efforts to tell you before a
                change affects an active project, pending enquiry or paid
                service, and to give you time to decide whether to continue.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Electronic signatures and records</h2>
              <p>
                You may sign these terms, and any separate written agreement, by
                electronic means, including a typed name, an electronic
                signature service, or an accepted digital record. Our records of
                your agreement, including any enrolment, acceptance or payment
                confirmation, are kept in a way that lets us prove the date and
                content of the agreement.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Severability and waiver</h2>
              <p>
                If any provision of these terms is found to be unenforceable,
                that provision will be limited or removed without changing the
                rest of the terms. No failure to enforce a provision is a
                waiver of that provision.
              </p>
            </section>

            <section>
              <h2 className={headingClass}>Contact</h2>
              <p>
                Questions about these terms can be sent to{" "}
                <a className={linkClass} href="mailto:info@nlargecorp.com">
                  info@nlargecorp.com
                </a>
                .
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Updates and contact</h2>
              <p>
                We may update these terms at any time. The current version took
                effect 15 November 2026; when a new version is live, its
governing-law, dispute-resolution and agreement sections will state the
                new effective date.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

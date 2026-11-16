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


export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy information for NLarge Global website enquiries and project work, including what we collect, retention, and how to request access, correction or deletion.",
  keywords: [
    "NLarge Global privacy policy",
    "personal data access request",
    "personal data correction",
    "personal data deletion",
    "website enquiry data",
  ],
  alternates: { canonical: "/privacy-policy" },
  openGraph: {
    title: "Privacy Policy | NLarge Global",
    description:
      "How NLarge Global handles website enquiries, project information, retention, and requests to access, correct or delete personal information.",
    url: "/privacy-policy",
    siteName: "NLarge Global",
    type: "website",
    images: [socialPreviewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | NLarge Global",
    description:
      "How NLarge Global handles website enquiries, project information, retention, and personal-data requests.",
    images: [socialPreviewImage.url],
  },
};

const sectionClass = "space-y-3";
const headingClass = "text-2xl font-semibold tracking-[-0.03em] text-black";
const linkClass = "font-semibold text-[#602329] underline underline-offset-4";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-6 text-sm text-black/60">
            Effective 15 November 2026
          </p>
        </header>

        <div className="grid gap-12 pt-12 lg:grid-cols-[0.55fr_1fr]">
          <p className="text-lg font-semibold">
            What we collect, why we keep it, and how you can ask us to remove it.
          </p>
          <div className="max-w-3xl space-y-10 leading-7 text-black/70">
            <section className={sectionClass}>
              <h2 className={headingClass}>Information we handle</h2>
              <p>
                When you use our contact form, we collect your name, email
                address, enquiry type, subject and message. We process the
                network address of a contact-form request to limit abuse. Our
                hosting, security and email delivery providers may also create
                technical logs needed to operate and protect the website.
              </p>
              <p>
                For potential and current business relationships, we may keep
                business and contact details, public business or profile links,
                referral sources, notes, follow-up details, project and
                technical information, correspondence, files, payment records and
                related documents. If you provide credentials or other access
                details for agreed project work, we may keep them for that work.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Why we use this information</h2>
              <p>
                We use information to respond to enquiries, assess and manage
                potential business relationships, deliver projects and support,
                communicate with clients, maintain business and payment records,
                protect our systems, and meet legal obligations.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>How long we keep it</h2>
              <p>
                If an enquiry does not lead to a project, we keep its
                contact-form information for no longer than 12 months after
                submission, then delete or anonymise it unless we need to keep it
                to resolve a dispute or meet a legal obligation.
              </p>
              <p>
                For client and project information, including files and any
                credentials you provide, the applicable project agreement sets
                the retention, return and deletion terms. We may keep records for
                longer when required by law or needed to resolve a dispute or
                protect our systems.
              </p>
              <p>We review business prospect information and remove it when it is no longer needed to assess or manage a potential business relationship, unless a legal or security reason requires us to keep it.</p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Lawful basis and marketing</h2>
              <p>
                Answering a contact form is necessary for us to perform our
                contractual obligation to respond to your enquiry and to manage
                any resulting project. We do not send marketing emails from
                contact-form submissions without your separate consent and, where
                required, an opt-in for each marketing channel (for example,
                email, SMS, direct message or post).
              </p>
              <p>
                If you do consent to marketing, you can withdraw it at any time
                by contacting us. Withdrawing consent will not affect any
                processing already carried out under a valid legal basis or
                agreement.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Who may process it</h2>
              <p>
                We use service providers for website hosting, data storage,
                private file storage and business email. They process
                information as needed to provide those services. We may also
                disclose information when required by law or when necessary to
                protect our rights, systems or users.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Security</h2>
              <p>
                We use access controls and technical safeguards to protect
                information. Client credentials stored for project work are
                encrypted and access is limited to the administrator. No method
                of online storage or transmission can be guaranteed to be
                completely secure.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Security incidents</h2>
              <p>
                If we confirm a personal-data breach affecting your information,
                we will notify you promptly and explain what happened and the
                steps you can take. We will notify regulators or other
                authorities within any deadline that applies to us. Some laws
                set a 72-hour deadline for reporting a breach to a regulator;
                that is not a universal deadline for notifying affected people.
                We will contact affected people, rather than every website
                visitor, when an incident does not affect everyone.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Your rights and how long we keep data</h2>
              <p className="leading-7">
                We may update this policy when our practices change. The current
                version took effect 15 November 2026; if it changes, we will
                show the new effective date before that version is live.
              </p>

              <p>
                You may have the right to access, correct, delete, restrict or
                port personal information we hold about you, and to object to
                processing where we rely on legitimate interests. To exercise
                these rights, email support@nlargecorp.com with your name, the
                email address or business associated with the information, and
                the project or record you are asking about. We may ask for
                information to verify your identity and locate the relevant
                records.
              </p>
              <p>
                After a successful request we will confirm the action, the date
                it was completed, and, where we did not act immediately, the date
                we completed it. Where we decline a request, we will explain the
                legal reason. We will not keep your personal information for
                longer than the retention periods above after the request is
                completed, unless we need to keep it to resolve a dispute,
                defend legal claims, or meet another legal obligation.
              </p>
            </section>

            <section className={sectionClass}>
              <h2 className={headingClass}>Cookies and similar technologies</h2>
              <p>
                The private admin area uses essential cookies for administrator
                login and request security. We do not currently use analytics or
                advertising cookies on the public website.
              </p>
            </section>

                                      <section className={sectionClass}>
              <h2 className={headingClass}>Updates and contact</h2>
              <p>
                We may update this policy when our practices change. The
                current version took effect 15 November 2026; if it changes,
                we will show the new effective date before that version is
                live.
              </p>
              <p className="leading-7">
                For privacy questions, email{" "}
                <a className={linkClass} href="mailto:support@nlargecorp.com">
                  support@nlargecorp.com
                </a>
                .
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

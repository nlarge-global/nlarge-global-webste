import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How NLarge Global collects, uses and protects information submitted through our website.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[92rem] px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
        <header className="border-b border-black pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Legal</p>
          <h1 className="mt-5 max-w-[10ch] text-[clamp(4rem,9vw,7.5rem)] leading-[0.86] tracking-[-0.055em]">Privacy Policy</h1>
          <p className="mt-6 text-sm text-black/60">Effective 6 November 2026</p>
        </header>
        <div className="grid gap-12 pt-12 lg:grid-cols-[0.55fr_1fr]">
          <p className="text-lg font-semibold">How we handle information shared with NLarge Global.</p>
          <div className="max-w-3xl space-y-10 leading-7 text-black/70">
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Information we collect</h2><p>When you submit our contact form, we may collect your name, email address, query type, subject and message. We may also receive basic technical data such as your browser type, device information, referring page and server logs necessary to operate and secure the website.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">How we use information</h2><p>We use submitted information to respond to enquiries, provide requested services, improve our website, prevent misuse, maintain security and meet legal obligations. We do not sell personal information.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Sharing and retention</h2><p>Information may be processed by trusted providers that support website hosting, email delivery and security. Service providers may process information only for the purposes we specify. We retain information for as long as reasonably necessary to handle your enquiry, maintain business records and comply with applicable law.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Your choices</h2><p>You may request access, correction or deletion of personal information you have provided by emailing <a className="font-semibold text-[#602329] underline underline-offset-4" href="mailto:info@nlargecorp.com">info@nlargecorp.com</a>. Availability of deletion may be limited where information must be retained for legal or security reasons.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Cookies and security</h2><p>We may use essential cookies or similar technologies to operate the website reliably and understand aggregate traffic. Reasonable technical and organizational measures are used to protect information, but no internet transmission can be guaranteed to be completely secure.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Policy updates</h2><p>We may update this policy as our services, technology or legal obligations change. The effective date above identifies the latest version.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Contact</h2><p>For privacy questions, contact <a className="font-semibold text-[#602329] underline underline-offset-4" href="mailto:info@nlargecorp.com">info@nlargecorp.com</a>.</p></section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

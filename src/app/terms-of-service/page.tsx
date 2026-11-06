import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Terms of Service | NLarge Global",
  description: "Terms governing use of the NLarge Global website and enquiries submitted through it.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main id="main-content" className="mx-auto max-w-[92rem] px-5 pb-20 pt-32 sm:px-8 lg:px-12 lg:pb-28 lg:pt-40">
        <header className="border-b border-black pb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">Legal</p>
          <h1 className="mt-5 max-w-[10ch] text-[clamp(4rem,9vw,7.5rem)] leading-[0.86] tracking-[-0.055em]">Terms of Service</h1>
          <p className="mt-6 text-sm text-black/55">Effective 6 November 2026</p>
        </header>
        <div className="grid gap-12 pt-12 lg:grid-cols-[0.55fr_1fr]">
          <p className="text-lg font-semibold">Rules for using this website and beginning a project enquiry.</p>
          <div className="max-w-3xl space-y-10 leading-7 text-black/70">
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Using the website</h2><p>You may use this website for lawful informational and business purposes. You must not interfere with its operation, attempt unauthorized access, introduce malicious code, scrape it in a way that disrupts service, or use its content in a manner that infringes our rights or another party&apos;s rights.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Website information</h2><p>Website content describes NLarge Global&apos;s capabilities and available information about products and services. It is provided for general purposes and does not constitute a binding proposal, professional advice or guarantee of a result. Product availability and scope may change.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Project enquiries</h2><p>Submitting an enquiry does not create an agreement or obligation to provide services. Any project begins only after the parties agree to applicable scope, timing, fees, deliverables and commercial terms in a separate written agreement.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Intellectual property</h2><p>Unless otherwise stated, the website, branding, design and original content are owned by or licensed to NLarge Global and are protected by applicable intellectual property laws. Project-specific ownership and licensing are governed by the relevant signed agreement.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Availability and liability</h2><p>We aim to keep the website accurate and available, but do not guarantee uninterrupted access or that every item of information is complete or current. To the maximum extent permitted by law, NLarge Global is not liable for indirect, incidental or consequential losses arising from use of the website.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">External links and third parties</h2><p>Links to external websites are provided for convenience. We are not responsible for their content, availability or practices, and accessing them is at your own discretion.</p></section>
            <section><h2 className="mb-3 text-2xl font-semibold tracking-[-0.03em] text-black">Changes and governing terms</h2><p>We may update these terms or the website at any time. Continued use after an update constitutes acceptance of the revised terms. Questions about these terms can be sent to <a className="font-semibold text-[#602329] underline underline-offset-4" href="mailto:info@nlargecorp.com">info@nlargecorp.com</a>.</p></section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

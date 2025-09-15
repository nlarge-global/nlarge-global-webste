import { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service - NLarge Global",
  description:
    "Terms of Service for NLarge Global. Read our terms and conditions for using our services and website.",
  openGraph: {
    title: "Terms of Service - NLarge Global",
    description:
      "Terms of Service for NLarge Global. Read our terms and conditions for using our services and website.",
  url: "https://nlargecorp.com/terms-of-service",
    siteName: "NLarge Global",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service - NLarge Global",
    description:
      "Terms of Service for NLarge Global. Read our terms and conditions for using our services and website.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://nlargecorp.com/terms-of-service",
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="prose max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Terms of Service
          </h1>
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 mb-4">
              By accessing and using the NLarge Global website and services, you
              accept and agree to be bound by the terms and provision of this
              agreement. If you do not agree to abide by the above, please do
              not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 mb-4">
              NLarge Global provides software development services, web
              development, mobile application development, consulting services,
              and related technology solutions. We reserve the right to modify
              or discontinue any service at any time without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. User Obligations
            </h2>
            <p className="text-gray-700 mb-4">
              As a user of our services, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide accurate and complete information when requested</li>
              <li>Use our services only for lawful purposes</li>
              <li>Not interfere with or disrupt our services or servers</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
              <li>Respect intellectual property rights</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Intellectual Property Rights
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Our Intellectual Property
                </h3>
                <p className="text-gray-700 mb-4">
                  All content, features, and functionality on our website,
                  including but not limited to text, graphics, logos, button
                  icons, images, audio clips, digital downloads, data
                  compilations, and software, are the exclusive property of
                  NLarge Global and are protected by copyright, trademark, and
                  other intellectual property laws.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Client Intellectual Property
                </h3>
                <p className="text-gray-700 mb-4">
                  We respect our clients' intellectual property rights. Any
                  custom development work performed for clients will be governed
                  by separate service agreements that clearly define ownership
                  rights.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Service Terms and Payment
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Service Agreements
                </h3>
                <p className="text-gray-700 mb-4">
                  Specific services will be governed by separate service
                  agreements that outline project scope, deliverables,
                  timelines, and payment terms.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Payment Terms
                </h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>
                    Payment terms will be specified in individual service
                    agreements
                  </li>
                  <li>Late payments may be subject to interest charges</li>
                  <li>Services may be suspended for non-payment</li>
                  <li>All prices are subject to applicable taxes</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Limitation of Liability
            </h2>
            <p className="text-gray-700 mb-4">
              To the fullest extent permitted by law, NLarge Global shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including without limitation, loss of profits,
              data, use, goodwill, or other intangible losses, resulting from
              your use of our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Disclaimer of Warranties
            </h2>
            <p className="text-gray-700 mb-4">
              Our services are provided on an "as is" and "as available" basis.
              We make no representations or warranties of any kind, express or
              implied, regarding the use or the results of our website or
              services in terms of their correctness, accuracy, reliability, or
              otherwise.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Indemnification
            </h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless NLarge Global, its
              officers, directors, employees, and agents from and against any
              claims, liabilities, damages, losses, and expenses arising out of
              or in any way connected with your use of our services or violation
              of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Termination
            </h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to terminate or suspend your access to our
              services immediately, without prior notice or liability, for any
              reason whatsoever, including without limitation if you breach the
              Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Governing Law
            </h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be interpreted and governed by the laws of the
              jurisdiction in which NLarge Global operates, without regard to
              its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Changes to Terms
            </h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. Changes
              will be effective immediately upon posting on our website. Your
              continued use of our services after any changes constitutes
              acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Contact Information
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please
              contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>NLarge Global</strong>
                <br />
                Email: legal@nlarge.com
                <br />
                Website: https://nlargecorp.com/contact
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy - NLarge Global",
  description:
    "Privacy Policy for NLarge Global. Learn how we collect, use, and protect your personal information.",
  openGraph: {
    title: "Privacy Policy - NLarge Global",
    description:
      "Privacy Policy for NLarge Global. Learn how we collect, use, and protect your personal information.",
    url: "https://nlarge.com/privacy-policy",
    siteName: "NLarge Global",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy - NLarge Global",
    description:
      "Privacy Policy for NLarge Global. Learn how we collect, use, and protect your personal information.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://nlarge.com/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="prose max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 mb-4">
              Welcome to NLarge Global ("we," "our," or "us"). We are committed
              to protecting your personal information and your right to privacy.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website or use our
              services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Personal Information
                </h3>
                <p className="text-gray-700 mb-2">
                  We may collect the following personal information:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Name and contact information (email, phone number)</li>
                  <li>Company information</li>
                  <li>Project requirements and specifications</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Automatically Collected Information
                </h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>IP address and browser information</li>
                  <li>Device information and operating system</li>
                  <li>Website usage patterns and analytics</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide and maintain our services</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Process and fulfill service requests</li>
              <li>Send important updates and notifications</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Information Sharing and Disclosure
            </h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or otherwise transfer your personal
              information to third parties without your consent, except in the
              following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                With trusted service providers who assist in operating our
                website
              </li>
              <li>When required by law or to respond to legal process</li>
              <li>To protect our rights, property, or safety</li>
              <li>
                In connection with a business transaction (merger, acquisition,
                etc.)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security
              measures to protect your personal information against unauthorized
              access, alteration, disclosure, or destruction. However, no method
              of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Access and update your personal information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to processing of your personal information</li>
              <li>Request data portability</li>
              <li>Withdraw consent where applicable</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Cookies
            </h2>
            <p className="text-gray-700 mb-4">
              Our website uses cookies to enhance your browsing experience. You
              can choose to disable cookies through your browser settings,
              though this may affect the functionality of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new Privacy Policy on
              this page with an updated "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Contact Us
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our privacy
              practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>NLarge Global</strong>
                <br />
                Email: privacy@nlarge.com
                <br />
                Website: https://nlarge.com/contact
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

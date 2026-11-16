import { connection } from "next/server";
import ContactForm from "@/features/contact/components/ContactForm";
import {
  getCurrentLegalDocument,
  getEffectiveMarketingConsent,
} from "@/features/legal/documents";

export default async function ContactPage() {
  await connection();
  const now = new Date();
  const privacyPolicy = getCurrentLegalDocument("privacyPolicy", now);
  const marketingConsent = getEffectiveMarketingConsent(now);
  if (!Array.isArray(privacyPolicy.contactAcknowledgement)) {
    throw new Error("The current Privacy Policy has no contact acknowledgement wording.");
  }

  return (
    <ContactForm
      privacyPolicyVersion={privacyPolicy.version}
      privacyPolicyHash={privacyPolicy.hash}
      privacyAcknowledgement={privacyPolicy.contactAcknowledgement}
      marketingConsentText={marketingConsent.text}
      marketingConsentVersion={marketingConsent.version}
    />
  );
}

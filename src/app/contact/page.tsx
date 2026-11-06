import ContactForm from "@/features/contact/components/ContactForm";
import EmailStatusToast from "@/features/contact/components/EmailStatusToast";
import { isEmailServiceAvailable } from "@/features/contact/services/email";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const emailServiceAvailable = await isEmailServiceAvailable();

  return (
    <>
      {!emailServiceAvailable && <EmailStatusToast recipientEmail="info@nlargecorp.com" />}
      <ContactForm />
    </>
  );
}

import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(50, "Name must be less than 50 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  queryType: z.enum(["general", "support", "business", "careers", "privacy"]),
  subject: z.string().trim().min(1, "Add a subject").max(100, "Subject must be less than 100 characters").refine((value) => value.length >= 5, "Subject must be at least 5 characters").refine((value) => !/[\r\n]/.test(value), "Invalid subject"),
  message: z.string().trim().min(1, "Tell us a little more").max(1000, "Message must be less than 1000 characters").refine((value) => value.length >= 10, "Message must be at least 10 characters"),
  privacyAcknowledgement: z.literal(true, { message: "Acknowledge the privacy notice to continue" }),
  marketingConsent: z.boolean().default(false),
});

export const contactSubmissionSchema = contactSchema.extend({
  privacyPolicyVersion: z.string().min(1).max(50),
  privacyPolicyHash: z.string().regex(/^[a-f\d]{64}$/i),
  marketingConsentVersion: z.string().min(1).max(50),
});

export type ContactFormInput = z.input<typeof contactSchema>;
export type ContactFormData = z.output<typeof contactSchema>;

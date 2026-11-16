import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contactSubmissionSchema } from "@/features/contact/schemas/contact";
import { isContactRateLimited } from "@/features/contact/api/rate-limit";
import { connectToDatabase } from "@/lib/mongodb";
import { Inquiry } from "@/features/admin/models/inquiry";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { recordInquirySubscription } from "@/features/contact/services/subscribers";
import {
  getCurrentLegalDocument,
  getEffectiveMarketingConsent,
  getRichTextContent,
} from "@/features/legal/documents";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || "unknown";
  try {
    const data = contactSubmissionSchema.parse(await request.json());
    if (await isContactRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return NextResponse.json({ error: "A valid submission key is required." }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Inquiry.findOne({ idempotencyKey });
    if (existing) {
      await recordInquirySubscription(existing);
      return NextResponse.json({ message: "Inquiry received" });
    }

    const acknowledgedAt = new Date();
    const privacyPolicy = getCurrentLegalDocument("privacyPolicy", acknowledgedAt);
    const marketingConsent = getEffectiveMarketingConsent(acknowledgedAt);
    if (!Array.isArray(privacyPolicy.contactAcknowledgement)) {
      throw new Error("The current Privacy Policy has no contact acknowledgement wording.");
    }
    if (
      data.privacyPolicyVersion !== privacyPolicy.version
      || data.privacyPolicyHash !== privacyPolicy.hash
      || (data.marketingConsent && data.marketingConsentVersion !== marketingConsent.version)
    ) {
      return NextResponse.json(
        { error: "The policy or consent wording has changed. Reload the contact page and try again." },
        { status: 409 },
      );
    }

    const {
      privacyPolicyVersion: _privacyPolicyVersion,
      privacyPolicyHash: _privacyPolicyHash,
      marketingConsentVersion: _marketingConsentVersion,
      ...contactData
    } = data;
    const inquiry = await Inquiry.create({
      ...contactData,
      privacyAcknowledgement: {
        version: privacyPolicy.version,
        hash: privacyPolicy.hash,
        text: getRichTextContent(privacyPolicy.contactAcknowledgement),
        acknowledgedAt,
        source: "contact-form",
      },
      marketingConsent: data.marketingConsent
        ? {
            version: marketingConsent.version,
            text: marketingConsent.text,
            grantedAt: acknowledgedAt,
            source: "contact-form",
          }
        : undefined,
      source: "website",
      idempotencyKey,
    });
    await recordInquirySubscription(inquiry);
    await writeAuditEvent({ actor: "public", action: "inquiry.created", resourceType: "inquiry", resourceId: String(inquiry._id), resourceLabel: inquiry.subject, requestId: getRequestId(request), metadata: { source: "website", status: inquiry.status } });
    return NextResponse.json({ message: "Inquiry received" });
  } catch (error) {
    console.error("Contact form error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.name === "MongoServerError" && "code" in error && error.code === 11000) {
      const idempotencyKey = request.headers.get("idempotency-key")?.trim();
      const existing = idempotencyKey
        ? await Inquiry.findOne({ idempotencyKey })
        : null;
      if (existing) {
        await recordInquirySubscription(existing);
        return NextResponse.json({ message: "Inquiry received" });
      }
    }
    return NextResponse.json({ error: "Failed to save inquiry. Please try again." }, { status: 500 });
  }
}

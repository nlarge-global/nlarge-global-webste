import { getDisplayErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";
import { connectToDatabase } from "@/lib/mongodb";
import { Subscriber } from "@/features/contact/models/subscriber";
import { getVerifiedSubscriberAddressKey } from "@/features/contact/services/unsubscribe-token";
import { getEffectiveMarketingConsent } from "@/features/legal/documents";

const requestSchema = z.object({
  token: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const { token } = requestSchema.parse(await request.json());
    const unsubscribeKey = getVerifiedSubscriberAddressKey(token);
    if (!unsubscribeKey) {
      return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400 });
    }

    await connectToDatabase();
    const occurredAt = new Date();
    const marketingConsent = getEffectiveMarketingConsent(occurredAt);
    const subscriber = await Subscriber.findOneAndUpdate(
      { unsubscribeKey, status: "subscribed" },
      {
        $set: { status: "unsubscribed", unsubscribedAt: occurredAt },
        $push: {
          consentEvents: {
            action: "withdrawn",
            version: marketingConsent.withdrawalVersion,
            text: marketingConsent.withdrawalText,
            occurredAt,
            source: "unsubscribe-link",
          },
        },
      },
      { new: true },
    ).select("_id");

    if (subscriber) {
      await writeAuditEvent({
        actor: "public",
        action: "subscriber.unsubscribed",
        resourceType: "subscriber",
        resourceId: String(subscriber._id),
        requestId: getRequestId(request),
        metadata: { channel: "email", status: "unsubscribed" },
      });
    }

    return NextResponse.json({ message: "This email address is unsubscribed from marketing updates." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400 });
    }
    console.error("Unsubscribe request failed:", error);
    return NextResponse.json({ error: getDisplayErrorMessage(error, "Unable to update your subscription. Please try again.") }, { status: 500 });
  }
}

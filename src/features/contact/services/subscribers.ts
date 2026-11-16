import { Subscriber, type SubscriberConsentEvent } from "@/features/contact/models/subscriber";
import { Inquiry, type InquiryDocument } from "@/features/admin/models/inquiry";
import { createSubscriberAddressKey } from "@/features/contact/services/unsubscribe-token";

export async function recordInquirySubscription(inquiry: InquiryDocument) {
  const consent = inquiry.marketingConsent;
  if (!consent || inquiry.marketingSubscriptionRecordedAt) return;

  const event: SubscriberConsentEvent = {
    action: "granted",
    version: consent.version,
    text: consent.text,
    occurredAt: consent.grantedAt,
    source: consent.source,
    sourceId: String(inquiry._id),
  };
  const existing = await Subscriber.findOne({ email: inquiry.email }).select("_id consentEvents unsubscribeKey");
  if (existing) {
    if (!existing.consentEvents.some((item) => item.sourceId === event.sourceId)) {
      await Subscriber.updateOne(
        { _id: existing._id, "consentEvents.sourceId": { $ne: event.sourceId } },
        {
          $set: {
            status: "subscribed",
            unsubscribedAt: null,
            unsubscribeKey: createSubscriberAddressKey(),
          },
          $push: { consentEvents: event },
        },
      );
    }
  } else {
    try {
      await Subscriber.create({
        email: inquiry.email,
        unsubscribeKey: createSubscriberAddressKey(),
        status: "subscribed",
        consentEvents: [event],
      });
    } catch (error) {
      if (
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== 11000
      ) {
        throw error;
      }

      await Subscriber.updateOne(
        { email: inquiry.email, "consentEvents.sourceId": { $ne: event.sourceId } },
        {
          $set: {
            status: "subscribed",
            unsubscribedAt: null,
            unsubscribeKey: createSubscriberAddressKey(),
          },
          $push: { consentEvents: event },
        },
      );
    }
  }

  await Inquiry.updateOne(
    { _id: inquiry._id, marketingSubscriptionRecordedAt: { $exists: false } },
    { $set: { marketingSubscriptionRecordedAt: new Date() } },
  );
}

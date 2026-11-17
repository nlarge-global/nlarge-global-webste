import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isUnsubscribeRequestRateLimited } from "@/features/contact/api/rate-limit";
import { Subscriber } from "@/features/contact/models/subscriber";
import { createUnsubscribeToken } from "@/features/contact/services/unsubscribe-token";
import { sendUnsubscribeLinkEmail } from "@/features/contact/services/email";
import { connectToDatabase } from "@/lib/mongodb";
import { siteUrl } from "@/lib/site";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || "unknown";

  try {
    const { email } = requestSchema.parse(await request.json());
    if (await isUnsubscribeRequestRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }

    await connectToDatabase();
    const subscriber = await Subscriber.findOne({
      email: email.toLowerCase(),
      status: "subscribed",
    }).select("email unsubscribeKey").lean();

    if (subscriber) {
      const unsubscribeUrl = new URL("/unsubscribe", siteUrl);
      unsubscribeUrl.searchParams.set(
        "token",
        createUnsubscribeToken(subscriber.unsubscribeKey),
      );
      await sendUnsubscribeLinkEmail(subscriber.email, unsubscribeUrl.toString());
    }

    return NextResponse.json(
      { message: "If the address is subscribed, an email with instructions will arrive shortly." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("Unsubscribe link request failed:", error);
    return NextResponse.json(
      { error: "Unable to send an email preferences link. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

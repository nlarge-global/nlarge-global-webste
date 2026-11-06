import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contactSchema } from "@/features/contact/schemas/contact";
import { sendContactEmails } from "@/features/contact/services/email";
import { getServerEnv } from "@/lib/env";
import { isContactRateLimited } from "@/features/contact/api/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || "unknown";
  try {
    if (await isContactRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const env = getServerEnv();
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      console.error("SMTP credentials are not configured");
      return NextResponse.json({ error: "Email service is not configured" }, { status: 500 });
    }

    const data = contactSchema.parse(await request.json());
    await sendContactEmails(data);
    return NextResponse.json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}

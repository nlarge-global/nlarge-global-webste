import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendContactEmails } from "@/lib/email";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  queryType: z.enum(["general", "support", "business", "careers"]),
  subject: z.string().trim().min(5).max(200).refine((value) => !/[\r\n]/.test(value), "Invalid subject"),
  message: z.string().trim().min(10).max(2000),
});

function isRateLimited(ip: string) {
  const now = Date.now();
  const limit = rateLimitStore.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) return true;
  limit.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP credentials are not configured");
    return NextResponse.json({ error: "Email service is not configured" }, { status: 500 });
  }

  try {
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

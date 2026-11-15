import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contactSchema } from "@/features/contact/schemas/contact";
import { isContactRateLimited } from "@/features/contact/api/rate-limit";
import { connectToDatabase } from "@/lib/mongodb";
import { Inquiry } from "@/features/admin/models/inquiry";
import { getRequestId, writeAuditEvent } from "@/features/admin/services/audit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    || "unknown";
  try {
    const data = contactSchema.parse(await request.json());
    if (await isContactRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return NextResponse.json({ error: "A valid submission key is required." }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Inquiry.findOne({ idempotencyKey }).select("_id");
    if (existing) return NextResponse.json({ message: "Inquiry received" });

    const inquiry = await Inquiry.create({ ...data, source: "website", idempotencyKey });
    await writeAuditEvent({ actor: "public", action: "inquiry.created", resourceType: "inquiry", resourceId: String(inquiry._id), resourceLabel: inquiry.subject, requestId: getRequestId(request), metadata: { source: "website", status: inquiry.status } });
    return NextResponse.json({ message: "Inquiry received" });
  } catch (error) {
    console.error("Contact form error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.name === "MongoServerError" && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "Inquiry received" });
    }
    return NextResponse.json({ error: "Failed to save inquiry. Please try again." }, { status: 500 });
  }
}

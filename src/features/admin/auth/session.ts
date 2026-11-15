import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import { connectToDatabase } from "@/lib/mongodb";
import { getOrCreateModel } from "@/lib/mongoose-model";
import { Schema, type Document } from "mongoose";

const SESSION_COOKIE = "nlarge_admin_session";
const CSRF_COOKIE = "nlarge_admin_csrf";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type AdminSessionDocument = Document & {
  tokenHash: string;
  csrfToken: string;
  expiresAt: Date;
  revokedAt?: Date;
  lastUsedAt: Date;
};

const sessionSchema = new Schema<AdminSessionDocument>({
  tokenHash: { type: String, required: true, unique: true, index: true },
  csrfToken: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date, default: null },
  lastUsedAt: { type: Date, required: true },
}, { timestamps: true });

const AdminSession = getOrCreateModel<AdminSessionDocument>("AdminSession", sessionSchema);

function hashToken(token: string) {
  const secret = getServerEnv().ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is required");
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createAdminSession() {
  await connectToDatabase();
  const token = crypto.randomBytes(32).toString("base64url");
  const csrfToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await AdminSession.create({
    tokenHash: hashToken(token),
    csrfToken,
    expiresAt,
    lastUsedAt: new Date(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, cookieOptions(Math.floor(SESSION_TTL_MS / 1000)));
  cookieStore.set(CSRF_COOKIE, csrfToken, { ...cookieOptions(Math.floor(SESSION_TTL_MS / 1000)), httpOnly: false });
  return { expiresAt };
}

export async function getCurrentAdminSession() {
  await connectToDatabase();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await AdminSession.findOne({
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  await AdminSession.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } });
  return session;
}

export async function requireAdminSession() {
  const session = await getCurrentAdminSession();
  if (!session) throw new Error("ADMIN_UNAUTHORIZED");
  return session;
}

export async function revokeCurrentAdminSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await connectToDatabase();
    await AdminSession.updateOne({ tokenHash: hashToken(token), revokedAt: null }, { $set: { revokedAt: new Date() } });
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(CSRF_COOKIE);
}

export async function validateCsrfToken(request: Request, session: AdminSessionDocument) {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin || new URL(origin).origin !== requestOrigin) throw new Error("CSRF_ORIGIN_INVALID");

  const token = request.headers.get("x-csrf-token");
  if (!token || token !== session.csrfToken) throw new Error("CSRF_TOKEN_INVALID");
}

export function getAdminCredentials() {
  const env = getServerEnv();
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH || !env.ADMIN_SESSION_SECRET) {
    throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and ADMIN_SESSION_SECRET are required");
  }
  return {
    email: env.ADMIN_EMAIL,
    passwordHash: env.ADMIN_PASSWORD_HASH,
  };
}

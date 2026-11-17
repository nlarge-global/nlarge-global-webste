import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

export type ContactEmailData = {
  name: string;
  email: string;
  queryType: "general" | "support" | "business" | "careers" | "privacy";
  subject: string;
  message: string;
};

function getRecipients(): Record<ContactEmailData["queryType"], string> {
  const env = getServerEnv();
  return {
    general: env.CONTACT_GENERAL_EMAIL,
    support: env.CONTACT_SUPPORT_EMAIL,
    business: env.CONTACT_GENERAL_EMAIL,
    careers: env.CONTACT_GENERAL_EMAIL,
    privacy: env.CONTACT_SUPPORT_EMAIL,
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!);
}

function createTransporter() {
  const env = getServerEnv();
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS are required");
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    requireTLS: env.SMTP_SECURE !== "true",
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

export async function verifyDashboardEmail() {
  const transporter = createTransporter();
  try {
    await transporter.verify();
  } finally {
    transporter.close();
  }
}

let emailServiceCheck: Promise<boolean> | undefined;
let emailServiceCheckExpiresAt = 0;
let consecutiveEmailFailures = 0;
let emailChecksExhausted = false;
const MAX_EMAIL_CHECK_ATTEMPTS = 3;

export async function isEmailServiceAvailable() {
  const env = getServerEnv();
  if (!env.SMTP_USER || !env.SMTP_PASS) return false;
  if (emailChecksExhausted) return false;
  if (Date.now() < emailServiceCheckExpiresAt && emailServiceCheck) return emailServiceCheck;

  const transporter = createTransporter();
  emailServiceCheck = transporter.verify().then(() => {
    consecutiveEmailFailures = 0;
    return true;
  }).catch((error) => {
    consecutiveEmailFailures += 1;
    console.error(`Email service health check failed (${consecutiveEmailFailures}/${MAX_EMAIL_CHECK_ATTEMPTS}):`, error);
    if (consecutiveEmailFailures >= MAX_EMAIL_CHECK_ATTEMPTS) emailChecksExhausted = true;
    return false;
  }).finally(() => transporter.close());
  emailServiceCheckExpiresAt = Date.now() + (emailChecksExhausted ? 60_000 : 15_000);
  const available = await emailServiceCheck;
  if (available) emailServiceCheckExpiresAt = Date.now() + 60_000;
  return available;
}

export async function sendContactEmails(data: ContactEmailData) {
  if (/[\r\n]/.test(data.subject)) throw new Error("Invalid email subject");

  const env = getServerEnv();
  const recipient = getRecipients()[data.queryType];
  const transporter = createTransporter();
  const sender = `NLarge Global <${env.SMTP_USER}>`;
  const safe = {
    name: escapeHtml(data.name),
    email: escapeHtml(data.email),
    queryType: escapeHtml(data.queryType),
    subject: escapeHtml(data.subject),
    message: escapeHtml(data.message).replace(/\n/g, "<br>"),
  };

  await transporter.sendMail({
    from: sender,
    to: recipient,
    replyTo: data.email,
    subject: `[${data.queryType.toUpperCase()}] ${data.subject}`,
    text: `New contact form submission\n\nName: ${data.name}\nEmail: ${data.email}\nQuery type: ${data.queryType}\nSubject: ${data.subject}\n\n${data.message}`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111"><h1 style="color:#602329">New contact form submission</h1><p><strong>Name:</strong> ${safe.name}</p><p><strong>Email:</strong> ${safe.email}</p><p><strong>Query type:</strong> ${safe.queryType}</p><p><strong>Subject:</strong> ${safe.subject}</p><p><strong>Message:</strong></p><p>${safe.message}</p></body></html>`,
  });

  try {
    await transporter.sendMail({
      from: sender,
      to: data.email,
      subject: "Thank you for contacting NLarge Global",
      text: `Hi ${data.name},\n\nThank you for contacting NLarge Global. We received your inquiry and will respond within 24 hours.\n\nBest regards,\nNLarge Global`,
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111"><h1 style="color:#602329">Thank you</h1><p>Hi ${safe.name},</p><p>Thank you for contacting NLarge Global. We received your inquiry and will respond within 24 hours.</p><p>Best regards,<br>NLarge Global</p></body></html>`,
    });
  } catch (error) {
    console.error("Visitor confirmation email failed after staff notification:", error);
  }
}

export async function sendUnsubscribeLinkEmail(email: string, unsubscribeUrl: string) {
  const env = getServerEnv();
  const transporter = createTransporter();
  const safeUrl = escapeHtml(unsubscribeUrl);

  try {
    await transporter.sendMail({
      from: `NLarge Global <${env.SMTP_USER}>`,
      to: email,
      subject: "Confirm your NLarge Global unsubscribe request",
      text: `We received a request to stop marketing emails from NLarge Global. Confirm your choice here:\n\n${unsubscribeUrl}\n\nIf you did not make this request, you can ignore this email.`,
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111"><h1 style="color:#602329">Confirm your email preferences</h1><p>We received a request to stop marketing emails from NLarge Global.</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#602329;color:#fff;text-decoration:none">Review email preferences</a></p><p>If you did not make this request, you can ignore this email.</p></body></html>`,
    });
  } finally {
    transporter.close();
  }
}

export type DashboardReplyData = {
    recipient: string;
    subject: string;
    message: string;
    signature: string;
  };

export async function sendDashboardReply(data: DashboardReplyData) {
  if (/[\r\n]/.test(data.subject)) throw new Error("Invalid email subject");
  const env = getServerEnv();
  const transporter = createTransporter();
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br>");
  const safeSignature = escapeHtml(data.signature).replace(/\n/g, "<br>");

  try {
    await transporter.sendMail({
      from: `NLarge Global <${env.SMTP_USER}>`,
      to: data.recipient,
      subject: data.subject,
      text: `${data.message}\n\n${data.signature}`,
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111"><p>${safeMessage}</p><p>${safeSignature}</p></body></html>`,
    });
  } finally {
    transporter.close();
  }
}

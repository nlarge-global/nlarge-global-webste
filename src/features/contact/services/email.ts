import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

export type ContactEmailData = {
  name: string;
  email: string;
  queryType: "general" | "support" | "business" | "careers";
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
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
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

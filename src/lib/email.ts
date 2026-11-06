import nodemailer from "nodemailer";

export type ContactEmailData = {
  name: string;
  email: string;
  queryType: "general" | "support" | "business" | "careers";
  subject: string;
  message: string;
};

const recipients: Record<ContactEmailData["queryType"], string> = {
  general: process.env.CONTACT_GENERAL_EMAIL || "info@nlargecorp.com",
  support: process.env.CONTACT_SUPPORT_EMAIL || "support@nlargecorp.com",
  business: process.env.CONTACT_GENERAL_EMAIL || "info@nlargecorp.com",
  careers: process.env.CONTACT_GENERAL_EMAIL || "info@nlargecorp.com",
};

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
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: process.env.SMTP_SECURE !== "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendContactEmails(data: ContactEmailData) {
  if (/[\r\n]/.test(data.subject)) throw new Error("Invalid email subject");

  const recipient = recipients[data.queryType];
  const transporter = createTransporter();
  const safe = {
    name: escapeHtml(data.name),
    email: escapeHtml(data.email),
    queryType: escapeHtml(data.queryType),
    subject: escapeHtml(data.subject),
    message: escapeHtml(data.message).replace(/\n/g, "<br>"),
  };

  await transporter.sendMail({
    from: `NLarge Global <${process.env.SMTP_USER}>`,
    to: recipient,
    replyTo: data.email,
    subject: `[${data.queryType.toUpperCase()}] ${data.subject}`,
    text: `New contact form submission\n\nName: ${data.name}\nEmail: ${data.email}\nQuery type: ${data.queryType}\nSubject: ${data.subject}\n\n${data.message}`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111"><h1 style="color:#602329">New contact form submission</h1><p><strong>Name:</strong> ${safe.name}</p><p><strong>Email:</strong> ${safe.email}</p><p><strong>Query type:</strong> ${safe.queryType}</p><p><strong>Subject:</strong> ${safe.subject}</p><p><strong>Message:</strong></p><p>${safe.message}</p></body></html>`,
  });

  await transporter.sendMail({
    from: `NLarge Global <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: "Thank you for contacting NLarge Global",
    text: `Hi ${data.name},\n\nThank you for contacting NLarge Global. We received your inquiry and will respond within 24 hours.\n\nBest regards,\nNLarge Global`,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#111"><h1 style="color:#602329">Thank you</h1><p>Hi ${safe.name},</p><p>Thank you for contacting NLarge Global. We received your inquiry and will respond within 24 hours.</p><p>Best regards,<br>NLarge Global</p></body></html>`,
  });
}

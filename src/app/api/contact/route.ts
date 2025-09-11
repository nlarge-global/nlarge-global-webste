import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"

// Rate limiting store (in production, use Redis or a database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 5 // 5 requests per window

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  queryType: z.enum(["general", "support", "business", "careers"], {
    message: "Invalid query type",
  }),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message too long"),
})

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return true
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  // Increment count
  userLimit.count++
  return true
}

// Email configuration
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Determine recipient email based on query type
function getRecipientEmail(queryType: string): string {
  const emailMap = {
    general: "info@nlargecorp.com",
    support: "support@nlargecorp.com",
    business: "info@nlargecorp.com",
    careers: "info@nlargecorp.com",
  }
  return emailMap[queryType as keyof typeof emailMap] || "info@nlargecorp.com"
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
  // NextRequest does not have .ip, use x-forwarded-for or remote address
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    // Check for required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP credentials not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Create transporter
    const transporter = createTransporter()

    // Verify transporter configuration
    try {
      await transporter.verify()
    } catch (error) {
      console.error("SMTP configuration error:", error)
      return NextResponse.json({ error: "Email service unavailable" }, { status: 500 })
    }

    // Determine recipient email
    const recipientEmail = getRecipientEmail(validatedData.queryType)

    // Email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c2c2c; color: #faf9f6; padding: 20px; text-align: center; }
            .content { background: #faf9f6; padding: 30px; border: 1px solid #e0e0e0; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #2c2c2c; }
            .value { margin-top: 5px; padding: 10px; background: white; border-left: 3px solid #2c2c2c; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Contact Form Submission</h1>
              <p>NLarge Global - Crafting Excellence</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${validatedData.name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${validatedData.email}</div>
              </div>
              <div class="field">
                <div class="label">Query Type:</div>
                <div class="value">${validatedData.queryType.charAt(0).toUpperCase() + validatedData.queryType.slice(1)}</div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${validatedData.subject}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${validatedData.message.replace(/\n/g, "<br>")}</div>
              </div>
            </div>
            <div class="footer">
              <p>This email was sent from the NLarge Global contact form.</p>
              <p>Received at: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const recipientGroup = validatedData.queryType == "general" ? "Inforamation" : validatedData.queryType.charAt(0).toUpperCase() + validatedData.queryType.slice(1);

    // Send email
    const mailOptions = {
      from: `"NLarge Global ${recipientGroup}" <${recipientEmail}>`,
      to: recipientEmail,
      replyTo: validatedData.email,
      subject: `[${validatedData.queryType.toUpperCase()}] ${validatedData.subject}`,
      html: emailHtml,
      text: `
        New Contact Form Submission
        
        Name: ${validatedData.name}
        Email: ${validatedData.email}
        Query Type: ${validatedData.queryType}
        Subject: ${validatedData.subject}
        
        Message:
        ${validatedData.message}
        
        Received at: ${new Date().toLocaleString()}
      `,
    }

    await transporter.sendMail(mailOptions)

    // Send auto-reply to user
    const autoReplyOptions = {
      from: `"NLarge Global ${recipientGroup}" <${recipientEmail}>`,
      to: validatedData.email,
      subject: "Thank you for contacting NLarge Global",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2c2c2c; color: #faf9f6; padding: 20px; text-align: center; }
              .content { background: #faf9f6; padding: 30px; border: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You</h1>
                <p>NLarge Global - Crafting Excellence</p>
              </div>
              <div class="content">
                <p>Dear ${validatedData.name},</p>
                <p>Thank you for reaching out to NLarge Global. We have received your ${validatedData.queryType} inquiry and will respond within 24 hours.</p>
                <p>Your message: "${validatedData.subject}"</p>
                <p>We appreciate your interest in our services and look forward to assisting you.</p>
                <p>Best regards,<br>The NLarge Global Support Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }

    await transporter.sendMail(autoReplyOptions)

    return NextResponse.json({ message: "Message sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Contact form error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 })
  }
}

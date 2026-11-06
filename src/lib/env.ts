import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("https://nlargecorp.com"),
  SMTP_HOST: z.string().min(1).optional().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_SECURE: z.enum(["true", "false"]).optional().default("false"),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().min(1).optional(),
  CONTACT_GENERAL_EMAIL: z.string().email().optional().default("info@nlargecorp.com"),
  CONTACT_SUPPORT_EMAIL: z.string().email().optional().default("support@nlargecorp.com"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  DEV_ALLOWED_ORIGINS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  }
  return result.data;
}

import { z } from "zod";

const emptyToUndefined = (value: unknown) => value === "" ? undefined : value;

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("https://www.nlargecorp.com"),
  MONGODB_URI: z.string().min(1).optional(),
  SMTP_HOST: z.string().min(1).optional().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  SMTP_SECURE: z.enum(["true", "false"]).optional().default("false"),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().min(1).optional(),
  CONTACT_GENERAL_EMAIL: z.string().email().optional().default("info@nlargecorp.com"),
  CONTACT_SUPPORT_EMAIL: z.string().email().optional().default("support@nlargecorp.com"),
  UPSTASH_REDIS_REST_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  DEV_ALLOWED_ORIGINS: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_DISPLAY_NAME: z.string().min(1).optional(),
  ADMIN_PASSWORD_HASH: z.string().min(1).optional(),
  ADMIN_SESSION_SECRET: z.string().min(32).optional(),
  UNSUBSCRIBE_TOKEN_SECRET: z.string().min(32).optional(),
  MASTER_ENCRYPTION_KEY: z.string().min(32).optional(),
  MASTER_ENCRYPTION_KEY_VERSION: z.string().min(1).optional().default("v1"),
  R2_ENDPOINT: z.preprocess(emptyToUndefined, z.string().url().optional()),
  R2_ACCESS_KEY_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  R2_SECRET_ACCESS_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  R2_BUCKET_NAME: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment configuration: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}`);
  }
  return result.data;
}

export function getMongoUri() {
  const { MONGODB_URI } = getServerEnv();
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is required for admin data operations");
  }
  return MONGODB_URI;
}

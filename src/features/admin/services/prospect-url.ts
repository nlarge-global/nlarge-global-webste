import type { ProspectSource } from "@/features/admin/models/prospect";

export function normalizeProspectUrl(value: string) {
  const input = value.trim();
  if (!input || input.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  const normalized = url.toString();
  return normalized.length <= 2048 ? normalized : null;
}

export function extractSharedUrl(urlValue: FormDataEntryValue | null, textValue: FormDataEntryValue | null) {
  const sharedUrl = typeof urlValue === "string" ? normalizeProspectUrl(urlValue) : null;
  if (sharedUrl) return sharedUrl;
  if (typeof textValue !== "string") return null;
  const textUrl = textValue.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[),.;!?]+$/, "");
  return textUrl ? normalizeProspectUrl(textUrl) : null;
}

export function sourceFromProspectUrl(value: string): ProspectSource {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (
    hostname === "maps.app.goo.gl" ||
    (hostname === "goo.gl" && url.pathname.startsWith("/maps")) ||
    hostname === "maps.google.com" ||
    (hostname === "google.com" && url.pathname.startsWith("/maps"))
  ) {
    return "google-maps";
  }
  if (hostname === "instagram.com" || hostname.endsWith(".instagram.com")) return "instagram";
  if (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")) return "linkedin";
  return "other";
}

export function prospectAuditLabel(name?: string, value?: string) {
  if (name?.trim()) return name;
  if (!value) return undefined;
  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

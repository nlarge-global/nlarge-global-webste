import { isRateLimited } from "@/lib/rate-limit";

export function isContactRateLimited(ip: string) {
  return isRateLimited("contact", ip);
}

export function isUnsubscribeRequestRateLimited(ip: string) {
  return isRateLimited("unsubscribeRequest", ip);
}

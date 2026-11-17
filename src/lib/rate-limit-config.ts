const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const RATE_LIMITS = {
  globalApi: {
    keyPrefix: "global-api-rate",
    maxRequests: 300,
    windowMs: FIFTEEN_MINUTES,
  },
  adminLogin: {
    keyPrefix: "admin-login-rate",
    maxRequests: 10,
    windowMs: FIFTEEN_MINUTES,
  },
  contact: {
    keyPrefix: "contact-rate",
    maxRequests: 5,
    windowMs: FIFTEEN_MINUTES,
  },
  unsubscribeRequest: {
    keyPrefix: "unsubscribe-request-rate",
    maxRequests: 5,
    windowMs: FIFTEEN_MINUTES,
  },
} as const;

export function isRateLimitExceeded(requestCount: number, maxRequests: number) {
  return requestCount > maxRequests;
}

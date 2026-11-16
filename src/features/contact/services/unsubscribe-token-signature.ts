import crypto from "node:crypto";

export function createSubscriberAddressKey() {
  return crypto.randomBytes(32).toString("hex");
}

export function signSubscriberAddressKey(addressKey: string, secret: string) {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`unsubscribe:${addressKey}`)
    .digest("hex");
  return `${addressKey}.${signature}`;
}

export function verifySubscriberToken(token: string, secret: string) {
  const [addressKey, signature, ...rest] = token.split(".");
  if (
    rest.length > 0 ||
    !/^[a-f\d]{64}$/i.test(addressKey ?? "") ||
    !/^[a-f\d]{64}$/i.test(signature ?? "")
  ) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`unsubscribe:${addressKey}`)
    .digest();
  const actual = Buffer.from(signature, "hex");
  return crypto.timingSafeEqual(expected, actual) ? addressKey : null;
}

import { getServerEnv } from "@/lib/env";
import {
  createSubscriberAddressKey as createRandomSubscriberAddressKey,
  signSubscriberAddressKey,
  verifySubscriberToken,
} from "./unsubscribe-token-signature";

function getSigningSecret() {
  const secret = getServerEnv().UNSUBSCRIBE_TOKEN_SECRET;
  if (!secret) throw new Error("UNSUBSCRIBE_TOKEN_SECRET is required for unsubscribe links");
  return secret;
}

export function createSubscriberAddressKey() {
  return createRandomSubscriberAddressKey();
}

export function createUnsubscribeToken(addressKey: string) {
  return signSubscriberAddressKey(addressKey, getSigningSecret());
}

export function getVerifiedSubscriberAddressKey(token: string) {
  return verifySubscriberToken(token, getSigningSecret());
}

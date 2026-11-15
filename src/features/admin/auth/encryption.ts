import crypto from "node:crypto";
import { getServerEnv } from "@/lib/env";

export type EncryptedValue = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: string;
};

function getMasterKey() {
  const value = getServerEnv().MASTER_ENCRYPTION_KEY;
  if (!value) throw new Error("MASTER_ENCRYPTION_KEY is required");
  const key = /^[a-f\d]{64}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("MASTER_ENCRYPTION_KEY must encode exactly 32 bytes");
  return key;
}

function encrypt(plaintext: string, key: Buffer, keyVersion: string): EncryptedValue {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion,
  };
}

function decrypt(value: EncryptedValue, key: Buffer) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64"));
  decipher.setAuthTag(Buffer.from(value.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

export function createClientDataKey() {
  const key = crypto.randomBytes(32);
  const env = getServerEnv();
  return {
    key,
    wrapped: encrypt(key.toString("base64"), getMasterKey(), env.MASTER_ENCRYPTION_KEY_VERSION ?? "v1"),
  };
}

export function unwrapClientDataKey(value: EncryptedValue) {
  return Buffer.from(decrypt(value, getMasterKey()), "base64");
}

export function encryptSecretValue(value: string, clientKey: Buffer, keyVersion: string) {
  return encrypt(value, clientKey, keyVersion);
}

export function decryptSecretValue(value: EncryptedValue, clientKey: Buffer) {
  return decrypt(value, clientKey);
}

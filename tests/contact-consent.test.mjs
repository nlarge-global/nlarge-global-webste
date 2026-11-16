import assert from "node:assert/strict";
import test from "node:test";
import {
  contactSchema,
  contactSubmissionSchema,
} from "../src/features/contact/schemas/contact.ts";
import {
  getCurrentLegalDocument,
  getEffectiveMarketingConsent,
  getLegalDocumentVersion,
  getRichTextContent,
} from "../src/features/legal/documents.ts";
import {
  createSubscriberAddressKey,
  signSubscriberAddressKey,
  verifySubscriberToken,
} from "../src/features/contact/services/unsubscribe-token-signature.ts";
import { generateDeploymentSecret } from "../src/features/admin/auth/deployment-secret.ts";

const inquiry = {
  name: "Jane Smith",
  email: "jane@example.com",
  queryType: "business",
  subject: "Website project",
  message: "I would like to discuss a new website.",
  privacyAcknowledgement: true,
};

test("contact requires privacy acknowledgement and defaults marketing off", () => {
  const parsed = contactSchema.parse(inquiry);
  assert.equal(parsed.marketingConsent, false);
  assert.equal(contactSchema.parse({ ...inquiry, queryType: "privacy" }).queryType, "privacy");
  assert.equal(
    contactSchema.safeParse({ ...inquiry, privacyAcknowledgement: false }).success,
    false,
  );
  assert.equal(
    contactSchema.parse({ ...inquiry, marketingConsent: true }).marketingConsent,
    true,
  );
});

test("contact explains minimum subject and message lengths", () => {
  const shortSubject = contactSchema.safeParse({ ...inquiry, subject: "Hey" });
  const shortMessage = contactSchema.safeParse({ ...inquiry, message: "Too short" });
  const missingSubject = contactSchema.safeParse({ ...inquiry, subject: "" });
  const missingMessage = contactSchema.safeParse({ ...inquiry, message: "" });

  assert.equal(shortSubject.error.issues[0].message, "Subject must be at least 5 characters");
  assert.equal(shortMessage.error.issues[0].message, "Message must be at least 10 characters");
  assert.equal(missingSubject.error.issues[0].message, "Add a subject");
  assert.equal(missingMessage.error.issues[0].message, "Tell us a little more");
});

test("legal content resolves effective versions and fingerprints the complete archived document", () => {
  const now = new Date("2026-11-18T00:00:00+05:30");
  const privacyPolicy = getCurrentLegalDocument("privacyPolicy", now);
  const marketingConsent = getEffectiveMarketingConsent(now);
  assert.equal(privacyPolicy.version, "1.0");
  assert.equal(privacyPolicy.hash, getCurrentLegalDocument("privacyPolicy", now).hash);
  assert.match(privacyPolicy.hash, /^[a-f\d]{64}$/);
  const rightsSection = privacyPolicy.sections.find((section) => section.title === "Your rights and how long we keep data");
  assert.ok(rightsSection.paragraphs[1].some((segment) => segment.href === "/contact"));
  assert.match(rightsSection.paragraphs[1].at(-1).text, /do not send an email/);
  assert.equal(marketingConsent.version, "email-updates-1");
  assert.equal(marketingConsent.withdrawalVersion, "email-updates-withdrawal-1");
  assert.equal(
    getRichTextContent(privacyPolicy.contactAcknowledgement),
    "I understand that NLarge Global will store and use these details to respond to my inquiry, as explained in the Privacy Policy.",
  );
  assert.equal(
    getLegalDocumentVersion("privacyPolicy", "1.0", new Date("2026-11-16T00:00:00+05:30")),
    undefined,
  );
  assert.throws(() =>
    getCurrentLegalDocument("privacyPolicy", new Date("2026-11-16T00:00:00+05:30")),
  );
});

test("contact submission requires versioned policy metadata and a SHA-256 fingerprint", () => {
  const metadata = {
    privacyPolicyVersion: "1.1",
    privacyPolicyHash: "a".repeat(64),
    marketingConsentVersion: "email-updates-1",
  };
  assert.equal(
    contactSubmissionSchema.parse({ ...inquiry, ...metadata }).privacyPolicyHash,
    metadata.privacyPolicyHash,
  );
  assert.equal(
    contactSubmissionSchema.safeParse({
      ...inquiry,
      ...metadata,
      privacyPolicyHash: "invalid",
    }).success,
    false,
  );
});

test("unsubscribe tokens are signed for one subscriber key and invalidated by key rotation", () => {
  const addressKey = createSubscriberAddressKey();
  const token = signSubscriberAddressKey(addressKey, "test-secret");
  assert.equal(verifySubscriberToken(token, "test-secret"), addressKey);
  assert.equal(token.includes("jane@example.com"), false);
  assert.equal(verifySubscriberToken(token, "different-secret"), null);
  assert.equal(verifySubscriberToken(`${addressKey}.bad`, "test-secret"), null);

  const renewedAddressKey = createSubscriberAddressKey();
  assert.notEqual(renewedAddressKey, addressKey);
  assert.notEqual(verifySubscriberToken(token, "test-secret"), renewedAddressKey);
});

test("deployment secret generator returns correctly encoded independent 256-bit secrets", () => {
  const masterKey = generateDeploymentSecret("MASTER_ENCRYPTION_KEY");
  assert.equal(Buffer.from(masterKey, "base64").length, 32);

  for (const type of ["ADMIN_SESSION_SECRET", "UNSUBSCRIBE_TOKEN_SECRET"]) {
    const secret = generateDeploymentSecret(type);
    assert.match(secret, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(Buffer.from(secret, "base64url").length, 32);
  }

  assert.notEqual(
    generateDeploymentSecret("ADMIN_SESSION_SECRET"),
    generateDeploymentSecret("ADMIN_SESSION_SECRET"),
  );
});

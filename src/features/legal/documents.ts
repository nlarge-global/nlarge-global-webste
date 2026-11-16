import { createHash } from "node:crypto";
import legalDocuments from "../../content/legal-documents.json" with { type: "json" };

export type RichText = string | { text: string; href?: string }[];

export type LegalDocument = {
  version: string;
  effectiveAt: string;
  changeSummary: string;
  title: string;
  summary: string;
  metaDescription: string;
  keywords: string[];
  contactAcknowledgement?: RichText;
  sections: { title: string; paragraphs: RichText[] }[];
};

export type MarketingConsentDocument = {
  version: string;
  effectiveAt: string;
  changeSummary: string;
  text: string;
  withdrawalVersion: string;
  withdrawalText: string;
};

export type LegalDocumentKind = "privacyPolicy" | "termsOfService";
type VersionedDocument = LegalDocument | MarketingConsentDocument;

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function withHash<T extends VersionedDocument>(document: T) {
  return {
    ...document,
    hash: createHash("sha256").update(canonicalize(document)).digest("hex"),
  };
}

export const privacyPolicyVersions = legalDocuments.privacyPolicy.map(withHash);
export const termsOfServiceVersions = legalDocuments.termsOfService.map(withHash);
export const marketingConsentVersions = legalDocuments.marketingConsent.map(withHash);

const versionsByKind: Record<LegalDocumentKind, (LegalDocument & { hash: string })[]> = {
  privacyPolicy: privacyPolicyVersions,
  termsOfService: termsOfServiceVersions,
};

function validateVersions(documents: VersionedDocument[]) {
  const versions = new Set<string>();
  const effectiveTimes = new Set<number>();
  for (const document of documents) {
    const effectiveTime = Date.parse(document.effectiveAt);
    if (!document.version || versions.has(document.version)) {
      throw new Error(`Duplicate or missing legal version: ${document.version}`);
    }
    if (!Number.isFinite(effectiveTime) || effectiveTimes.has(effectiveTime)) {
      throw new Error(`Invalid or duplicate effective time for legal version ${document.version}`);
    }
    versions.add(document.version);
    effectiveTimes.add(effectiveTime);
  }
}

validateVersions(privacyPolicyVersions);
validateVersions(termsOfServiceVersions);
validateVersions(marketingConsentVersions);

export function getCurrentLegalDocument(kind: LegalDocumentKind, now = new Date()) {
  const current = versionsByKind[kind]
    .filter((document) => Date.parse(document.effectiveAt) <= now.getTime())
    .sort((left, right) => Date.parse(right.effectiveAt) - Date.parse(left.effectiveAt))[0];
  if (!current) throw new Error(`No effective ${kind} version is configured.`);
  return current;
}

export function getEffectiveMarketingConsent(now = new Date()) {
  const current = marketingConsentVersions
    .filter((document) => Date.parse(document.effectiveAt) <= now.getTime())
    .sort((left, right) => Date.parse(right.effectiveAt) - Date.parse(left.effectiveAt))[0];
  if (!current) throw new Error("No effective marketing consent version is configured.");
  return current;
}

export function getRichTextContent(content: RichText) {
  return typeof content === "string"
    ? content
    : content.map((segment) => segment.text).join("");
}

export function getLegalDocumentVersion(
  kind: LegalDocumentKind,
  version: string,
  now = new Date(),
) {
  return versionsByKind[kind].find(
    (document) => document.version === version && Date.parse(document.effectiveAt) <= now.getTime(),
  );
}

export function getEffectiveLegalDocumentVersions(
  kind: LegalDocumentKind,
  now = new Date(),
) {
  return versionsByKind[kind]
    .filter((document) => Date.parse(document.effectiveAt) <= now.getTime())
    .sort((left, right) => Date.parse(right.effectiveAt) - Date.parse(left.effectiveAt));
}

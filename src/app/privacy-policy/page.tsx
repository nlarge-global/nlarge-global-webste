import type { Metadata } from "next";
import { connection } from "next/server";
import LegalDocumentPage from "@/features/legal/components/LegalDocumentPage";
import { socialPreviewImage } from "@/lib/site";
import {
  getCurrentLegalDocument,
  getEffectiveLegalDocumentVersions,
} from "@/features/legal/documents";

export async function generateMetadata(): Promise<Metadata> {
  const document = getCurrentLegalDocument("privacyPolicy");
  return {
    title: document.title,
    description: document.metaDescription,
    keywords: document.keywords,
    alternates: { canonical: "/privacy-policy" },
    openGraph: {
      title: `${document.title} | NLarge Global`,
      description: document.metaDescription,
      url: "/privacy-policy",
      siteName: "NLarge Global",
      type: "website",
      images: [socialPreviewImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${document.title} | NLarge Global`,
      description: document.metaDescription,
      images: [socialPreviewImage.url],
    },
  };
}

export default async function PrivacyPolicyPage() {
  await connection();
  const now = new Date();
  const document = getCurrentLegalDocument("privacyPolicy", now);
  const versions = getEffectiveLegalDocumentVersions("privacyPolicy", now);

  return (
    <LegalDocumentPage
      kind="privacyPolicy"
      document={document}
      versions={versions}
    />
  );
}

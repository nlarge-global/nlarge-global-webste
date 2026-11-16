import type { Metadata } from "next";
import { connection } from "next/server";
import LegalDocumentPage from "@/features/legal/components/LegalDocumentPage";
import { socialPreviewImage } from "@/lib/site";
import {
  getCurrentLegalDocument,
  getEffectiveLegalDocumentVersions,
} from "@/features/legal/documents";

export async function generateMetadata(): Promise<Metadata> {
  const document = getCurrentLegalDocument("termsOfService");
  return {
    title: document.title,
    description: document.metaDescription,
    keywords: document.keywords,
    alternates: { canonical: "/terms-of-service" },
    openGraph: {
      title: `${document.title} | NLarge Global`,
      description: document.metaDescription,
      url: "/terms-of-service",
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

export default async function TermsOfServicePage() {
  await connection();
  const now = new Date();
  const document = getCurrentLegalDocument("termsOfService", now);
  const versions = getEffectiveLegalDocumentVersions("termsOfService", now);

  return (
    <LegalDocumentPage
      kind="termsOfService"
      document={document}
      versions={versions}
    />
  );
}

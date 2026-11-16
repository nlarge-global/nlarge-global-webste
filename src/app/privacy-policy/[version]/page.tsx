import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import LegalDocumentPage from "@/features/legal/components/LegalDocumentPage";
import { socialPreviewImage } from "@/lib/site";
import {
  getEffectiveLegalDocumentVersions,
  getLegalDocumentVersion,
} from "@/features/legal/documents";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ version: string }>;
}): Promise<Metadata> {
  const { version } = await params;
  const document = getLegalDocumentVersion("privacyPolicy", version);
  if (!document) notFound();
  return {
    title: `${document.title} ${version}`,
    description: document.metaDescription,
    keywords: document.keywords,
    alternates: { canonical: `/privacy-policy/${encodeURIComponent(version)}` },
    openGraph: {
      title: `${document.title} ${version} | NLarge Global`,
      description: document.metaDescription,
      url: `/privacy-policy/${encodeURIComponent(version)}`,
      siteName: "NLarge Global",
      type: "website",
      images: [socialPreviewImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${document.title} ${version} | NLarge Global`,
      description: document.metaDescription,
      images: [socialPreviewImage.url],
    },
  };
}

export default async function ArchivedPrivacyPolicyPage({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  await connection();
  const { version } = await params;
  const now = new Date();
  const document = getLegalDocumentVersion("privacyPolicy", version, now);
  if (!document) notFound();

  return (
    <LegalDocumentPage
      kind="privacyPolicy"
      document={document}
      versions={getEffectiveLegalDocumentVersions("privacyPolicy", now)}
    />
  );
}

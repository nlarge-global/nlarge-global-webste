export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nlargecorp.com").origin;
export const organizationId = `${siteUrl}/#organization`;
export const socialPreviewImage = {
  url: `${siteUrl}/og-image.png`,
  width: 1200,
  height: 630,
  alt: "NLarge Global — custom software, websites and apps",
};

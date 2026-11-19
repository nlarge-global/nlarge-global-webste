import Link from "next/link";

type PrivacyAcknowledgement = {
  version: string;
  hash?: string;
  text: string;
  acknowledgedAt: Date;
};

type MarketingConsent = {
  version: string;
  text: string;
  grantedAt: Date;
};

export default function InquiryConsentEvidence({
  privacyAcknowledgement,
  marketingConsent,
  legacyConsent,
  manuallyEntered,
}: {
  privacyAcknowledgement?: PrivacyAcknowledgement;
  marketingConsent?: MarketingConsent;
  legacyConsent: boolean;
  manuallyEntered: boolean;
}) {
  return (
    <details className="mt-4 max-w-3xl rounded-xl bg-[#f1efea] p-4">
      <summary className="cursor-pointer font-semibold text-[#602329] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329]">
        Privacy and consent evidence
      </summary>
      <div className="mt-4 space-y-4 text-sm leading-6 text-black/70">
        <section>
          <h2 className="font-semibold text-black">Privacy notice</h2>
          {privacyAcknowledgement ? (
            <>
              <p className="mt-1">
                Version {privacyAcknowledgement.version} acknowledged{" "}
                {privacyAcknowledgement.acknowledgedAt.toLocaleString()}.
              </p>
              <blockquote className="mt-2 whitespace-pre-wrap">
                {privacyAcknowledgement.text}
              </blockquote>
              <p className="mt-2">
                <Link
                  href={`/privacy-policy/${encodeURIComponent(privacyAcknowledgement.version)}`}
                  className="font-semibold text-[#602329] underline underline-offset-4"
                >
                  View acknowledged policy version
                </Link>
                {privacyAcknowledgement.hash
                  ? ` · SHA-256 ${privacyAcknowledgement.hash}`
                  : " · Legacy record without a document fingerprint"}
              </p>
            </>
          ) : (
            <p className="mt-1">
              {legacyConsent
                ? "Legacy public contact-form acknowledgement recorded."
                : manuallyEntered
                  ? "Not collected; this inquiry was entered manually."
                  : "No privacy acknowledgement recorded."}
            </p>
          )}
        </section>
        <section>
          <h2 className="font-semibold text-black">Marketing consent</h2>
          {marketingConsent ? (
            <>
              <p className="mt-1">
                Version {marketingConsent.version} recorded{" "}
                {marketingConsent.grantedAt.toLocaleString()}.
              </p>
              <blockquote className="mt-2 whitespace-pre-wrap">
                {marketingConsent.text}
              </blockquote>
            </>
          ) : (
            <p className="mt-1">
              {manuallyEntered
                ? "Not collected; this inquiry was entered manually."
                : privacyAcknowledgement
                  ? "Marketing updates were not selected."
                  : "No marketing consent recorded."}
            </p>
          )}
        </section>
      </div>
    </details>
  );
}

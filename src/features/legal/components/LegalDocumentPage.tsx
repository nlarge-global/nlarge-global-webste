import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";
import type {
  LegalDocument,
  LegalDocumentKind,
} from "@/features/legal/documents";

const linkClass = "font-semibold text-[#602329] underline underline-offset-4";

function documentPath(kind: LegalDocumentKind, version: string) {
  return `/${kind === "privacyPolicy" ? "privacy-policy" : "terms-of-service"}/${encodeURIComponent(version)}`;
}

function validateDocumentLinks(document: LegalDocument) {
  for (const section of document.sections) {
    for (const paragraph of section.paragraphs) {
      if (typeof paragraph === "string") continue;
      for (const segment of paragraph) {
        if (
          segment.href &&
          !(segment.href.startsWith("/") && !segment.href.startsWith("//")) &&
          !/^https?:\/\//i.test(segment.href) &&
          !/^mailto:/i.test(segment.href)
        ) {
          throw new Error(`Unsupported legal-document link: ${segment.href}`);
        }
      }
    }
  }
}

export default function LegalDocumentPage({
  kind,
  document,
  versions,
}: {
  kind: LegalDocumentKind;
  document: LegalDocument & { hash: string };
  versions: (LegalDocument & { hash: string })[];
}) {
  const isCurrent = versions[0]?.version === document.version;
  validateDocumentLinks(document);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-[92rem] px-5 pt-28 sm:px-8 lg:px-12 lg:pt-32"
      >
        <header className="border-b border-black pb-5">
          <h1 className="mt-5 text-[clamp(4rem,9vw,7.5rem)] leading-[0.86] tracking-[-0.055em]">
            {document.title}
          </h1>
          <p className="mt-6 text-sm text-black/60">
            Version {document.version} · Effective{" "}
            {new Date(document.effectiveAt).toLocaleString("en-IN", {
              dateStyle: "long",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            })}
            {" · "}
            {isCurrent ? "Current version" : "Archived version"}
          </p>
          <details className="mt-6 transition-all duration-300">
            <summary className="w-fit cursor-pointer font-semibold text-[#602329] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329]">
              Versions and document details
            </summary>
            <div className="mt-5 grid gap-6 text-sm leading-6 text-black/70 sm:grid-cols-2">
              <section>
                <h2 className="font-semibold text-black">
                  Document fingerprint
                </h2>
                <p className="mt-2">
                  SHA-256 · <code className="break-all">{document.hash}</code>
                </p>
              </section>
              <nav aria-label="Legal document versions">
                <h2 className="font-semibold text-black">Published versions</h2>
                <ul className="mt-2 space-y-2">
                  {versions.map((version) => (
                    <li key={version.version}>
                      {version.version === document.version ? (
                        <span aria-current="page">
                          Version {version.version} ·{" "}
                          {new Date(version.effectiveAt).toLocaleDateString(
                            "en-IN",
                            {
                              dateStyle: "long",
                              timeZone: "Asia/Kolkata",
                            },
                          )}
                          {" — "}
                          {version.changeSummary}
                          {version.version === versions[0]?.version
                            ? " (current)"
                            : ""}
                        </span>
                      ) : (
                        <Link
                          className={linkClass}
                          href={documentPath(kind, version.version)}
                        >
                          Version {version.version} ·{" "}
                          {new Date(version.effectiveAt).toLocaleDateString(
                            "en-IN",
                            {
                              dateStyle: "long",
                              timeZone: "Asia/Kolkata",
                            },
                          )}
                          {" — "}
                          {version.changeSummary}
                          {version.version === versions[0]?.version
                            ? " (current)"
                            : ""}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </details>
        </header>

        <div className="grid gap-12 pt-12 lg:grid-cols-[0.35fr_1fr]">
          <div className="space-y-10 leading-7 lg:sticky lg:top-28 lg:self-start">
            <p className="text-xl font-semibold">{document.summary}</p>
          </div>

          <div className="space-y-10 leading-7 text-black/70">
            {document.sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-black">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>
                    {typeof paragraph === "string"
                      ? paragraph
                      : paragraph.map((segment, segmentIndex) =>
                          segment.href ? (
                            <a
                              key={`${segment.href}-${segmentIndex}`}
                              className={linkClass}
                              href={segment.href}
                            >
                              {segment.text}
                            </a>
                          ) : (
                            <span key={segmentIndex}>{segment.text}</span>
                          ),
                        )}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

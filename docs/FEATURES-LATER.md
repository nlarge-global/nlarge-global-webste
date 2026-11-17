# Later features and operations

This document tracks approved work intentionally deferred from the current implementation. Do not treat these items as implemented.

## Showcase cleanup

- Remove the unused `ProjectShowcase` component and update the architecture documentation to reflect the current device showcase.

## Work portfolio and About page

- Add a Work tab with image-led case studies describing selected projects and their outcomes.
- Add an About page introducing the company and its team.
- Integrate both pages with public navigation, metadata, and the sitemap when implemented.

## Admin-managed legal content and notifications

The current legal documents are local, source-controlled records in `src/content/legal-documents.json`. This file is the single source for published text, effective dates, version summaries, SEO descriptions/keywords, privacy acknowledgement wording, and marketing consent wording.

When admin/database publishing is approved:

- Move all versions for the Privacy Policy, Terms of Service, and marketing-consent wording into an authenticated admin workflow and database. Do not split authority between source code and database.
- Support draft, review, scheduled effective time, publication, and immutable published history. Select the public version whose effective time has arrived most recently.
- Preserve canonical document content and its SHA-256 fingerprint. Store the exact version and fingerprint with each privacy acknowledgement; never backfill fingerprints onto legacy records.
- Keep policy-change notifications separate from marketing campaigns. Define affected audiences, legal basis, message, delivery state, retry behavior, and audit evidence before sending; do not assume every contact is a marketing subscriber.
- Plan a safe migration from local published versions and verify all historical fingerprints before switching public reads to the database.

## Master encryption key rotation

Client secrets are encrypted with a per-client data key. Each data key is wrapped by `MASTER_ENCRYPTION_KEY`; the client record stores the wrapped key, its AES-GCM IV and authentication tag, and `dataKeyVersion`. Secret values remain encrypted with the per-client data key.

Do not replace `MASTER_ENCRYPTION_KEY` directly. Without a migration, existing client data keys cannot be unwrapped, and client secrets become inaccessible.

Planned workflow:

1. **Add versioned key configuration.** Configure an active master-key version for new client data keys and allow the server to resolve old and new master keys by version. Fail closed if a record refers to a missing key version.
2. **Deploy compatibility before rotating.** Configure the existing key under its current version and the new key under a new version. Keep the existing version active while deploying this compatibility.
3. **Switch new writes.** Set the new version as active. New client data keys are wrapped with it; records already using the old version remain readable.
4. **Re-wrap existing client data keys.** Run an authenticated, resumable batch migration. For each client on the old version, unwrap the existing data key with the old master key, wrap that same data key with the new master key, then atomically replace the wrapped-key fields and version. Do not decrypt or rewrite client secret values.
5. **Verify and retain rollback.** Provide a dry-run, progress counts, retry-safe batches, and verification that no active records still require the old version. Never log keys, data keys, wrapped keys, or secret values. Keep the old key protected and available for a defined rollback period.
6. **Retire the old key.** Remove it from runtime configuration only after verification, backups, and the agreed rollback period. Preserve an explicit recovery procedure for interrupted or partially completed migrations.

Before implementation, define how soft-deleted clients and database backups are handled, restrict who can start the migration, and audit start/completion/failure without recording secret material.

This is a planned key rotation, not remediation for a compromised key. If compromise is suspected, re-wrapping does not make old database backups safe; handle it as a separate security incident.

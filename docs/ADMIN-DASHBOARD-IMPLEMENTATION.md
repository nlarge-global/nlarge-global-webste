# Admin Dashboard Implementation

## Purpose

Build a private NLarge Global admin dashboard for managing contact inquiries,
clients, communication history, encrypted client secrets, private documents,
payments, audit events, health checks, and minimal settings.

This file is the implementation source of truth. Any agent continuing this work
must read it before editing code, update its status after every completed
feature, and keep the implementation aligned with the decisions below.

## Working rules

1. Implement one feature end to end before starting the next feature.
2. Keep the interface small and the server-side modules deep: route handlers
   should compose reusable modules rather than contain database, auth,
   encryption, or business logic.
3. Use Server Components for read-heavy pages. Use Client Components only for
   browser interaction.
4. Validate at both HTTP and persistence seams with Zod and strict Mongoose
   schemas.
5. Check authorization inside every protected server operation; do not rely
   only on page-level protection.
6. Never log, return, preview, or audit secret values.
7. Make every destructive action require an explicit confirmation and a
   hold-to-delete interaction. A normal click must never delete data.
8. Make every dashboard surface usable on narrow mobile screens; mobile is a
   primary operating device, not a secondary breakpoint.
9. Complete the verification and documentation update for a feature before
   marking it complete.
10. After each feature, update:
   - this file's status and change log;
   - `docs/ARCHITECTURE.md`;
   - `example.env` when configuration changes;
   - relevant tests and route/component documentation.
11. After the final feature, review all documentation for consistency with the
   shipped implementation.

## Non-negotiable engineering safeguards

These are already part of the implementation scope and must not be treated as
optional polish:

- CSRF protection for cookie-authenticated state-changing requests, using
  same-origin checks and a server-validated token where required.
- Server-backed admin sessions with revocation, expiry, login rate limiting,
  and logout-all support; a signed cookie alone is insufficient.
- Idempotency for public contact submissions and any future email-send retry.
- Central request IDs, error taxonomy, safe toast responses, and bounded
  structured operational logs.
- Compact append-only audit events with bounded, human-readable resource labels,
  stable resource IDs, allowlisted metadata, and no credentials, contact details,
  message bodies, or other sensitive payloads in new writes.
- Versioned encryption metadata on every encrypted value, including IV,
  authentication tag, and key version.
- R2/MongoDB consistency handling for upload, metadata-save, deletion, and
  orphan cleanup.
- Server-side file signature and size validation, random object keys, private
  bucket access, and safe preview/download rules.
- Sanitized HTML email content, strict subject/header validation, and plain-text
  fallback generation.
- Cursor/page pagination and indexes for every collection-backed list.
- Short-lived, audited export files with cleanup and secrets excluded by
  default.
- Shared hold-to-delete control for every destructive UI action, backed by
  server-side authorization and confirmation checks.
- Mobile-first acceptance checks, keyboard support, visible focus, and
  reduced-motion behavior for every interactive feature.
- Backup, restore, encryption-key recovery, and client offboarding exercises
  before real client data is entered.

The only intentionally deferred safeguards are the midnight reminder worker,
automatic Gmail/Claude/MCP integrations, multi-admin identity management, and
the final retention/legal policy. They are explicitly tracked in the feature
sequence or later-work sections below.

## Current decisions

### Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Mongoose for MongoDB.
- Existing React Hook Form and Zod for forms and validation.
- Existing `react-icons`.
- Shadcn-style dashboard primitives and patterns, based on:
  https://shadcndashboard.dev/components
- `jose` for signed/encrypted session cookies.
- `bcryptjs` for verifying the admin password hash.
- Node `crypto` with AES-256-GCM for application-level secret encryption.
- AWS S3-compatible SDK with presigned URLs for private Cloudflare R2.
- Existing Nodemailer only for authenticated dashboard replies and Health
  checks.
- No TanStack Query initially. Prefer Server Components, URL search
  parameters, Route Handlers, local React state, and `router.refresh()`.
- No Gmail OAuth, Claude integration, or automatic message import initially.

### Public contact flow

The public contact form must:

```text
validate -> rate limit -> save Inquiry in MongoDB -> return success
```

It must not check SMTP availability or send email. Remove public use of
`isEmailServiceAvailable()` and all public SMTP dependency. SMTP belongs only
to the private dashboard reply flow and Health page.

### Collections and relationships

```text
Inquiry          -> optionally references Client
Client           -> has many Inquiry, Project, Secret, Document, PaymentRecord
Project          -> belongs to one Client; contains project-specific details
ConversationEntry -> belongs to Inquiry
Secret           -> belongs to Client
Document         -> belongs to Client; binary is stored in private R2
PaymentRecord    -> belongs to Client
AuditEvent       -> references a resource without storing secret values
Settings         -> minimal dashboard preferences/configuration
```

Overview is derived from these collections; it has no collection of its own.

Client records stay intentionally small. Project records contain the technical
and delivery details, and each project belongs to exactly one client. There is
no separate client-contact schema in the first version.

### Leads, tags, tasks, and sources

Website submissions default to `source: website`. Manually created inquiries
can use `whatsapp`, `linkedin`, `call`, `friend`, `personal`, `referral`, or
`other`, with an optional source note.

Inquiries and clients support lightweight tags. Inquiries also support:

- `priority`;
- `nextAction`;
- `followUpAt`;
- task status and completion notes.

Tasks are stored as actionable records linked to an inquiry, client, or
project. A later enhancement may add a midnight background job that sends
follow-up reminder emails; no background job is required for the initial
implementation.

### Authentication

For the first version, one admin is configured through server-only
environment variables:

```env
ADMIN_EMAIL=
ADMIN_DISPLAY_NAME=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
```

The plain password is never stored. A password change generates a new hash
once and shows manual Vercel environment-variable and redeploy instructions.
The generated hash is not persisted in MongoDB, logs, or browser storage.

### Encryption

Use one application `MASTER_ENCRYPTION_KEY` in deployment secrets, with
envelope encryption for client isolation:

```text
master key -> encrypted client key -> encrypted client secret
```

Generate and store a unique client data-encryption key per client, encrypted
by the master key. Store only encrypted values in MongoDB. Reveal/copy requires
an authenticated backend request and re-authentication, and creates an audit
event. Key rotation is a controlled server maintenance operation, not a normal
dashboard action.

### Secrets and environment files

Secret types must support:

- username and password;
- API key;
- token;
- connection string;
- environment file;
- certificate/private key;
- recovery codes;
- other.

`.env` content is treated as one encrypted environment-file secret. It is
download-only after authorization and re-authentication; it is never previewed
in the browser.

### Documents and R2

Use one private R2 bucket with object keys such as:

```text
clients/{clientId}/documents/{documentId}/{filename}
```

MongoDB stores metadata. The server verifies access and creates short-lived
signed URLs. PDFs and images may be previewed in a new tab; `.env` files,
archives, private keys, and unknown types are download-only.

### Payments

Store amount, currency, method, status, UTR/reference, milestone, paid date,
optional payment-proof document, and internal notes. Never store card numbers,
CVV, PINs, bank passwords, or payment login credentials.

### Communication

Use a manual conversation timeline with inbound/outbound direction and
email/WhatsApp/phone/meeting/internal-note channels. Entries are ordered by
the user-entered `occurredAt` timestamp. Do not make drag-and-drop the source
of truth.

Dashboard email replies support recipient, subject, HTML body, plain-text
fallback, live preview, signature, send status, and stored reply metadata.
HTML must be sanitized before sending and previewing.

An admin reply automatically creates both an inquiry-scoped email record and an
outbound conversation entry. Client replies entered manually create inbound
conversation entries and email records when the channel is email.

### Destructive actions

Delete buttons use a hold-to-delete control with a visible progress state and
accessible keyboard equivalent. The action only completes after the configured
hold duration and explicit confirmation text. The server repeats authorization
and deletion checks; UI controls are not the security boundary.

### Error handling and logging

Use one central error taxonomy and response helper for validation,
unauthorized, forbidden, not-found, conflict, rate-limit, storage, database,
and email errors. Show safe, actionable toast messages and keep structured
server logs with request IDs.

Logs are bounded. Do not retain high-volume raw application logs in MongoDB.
Audit events are compact and retained according to the post-implementation
retention decision. Operational error logs are rotated; a weekly sanitized
text summary may be archived to private R2, with no secrets, request bodies, or
credential values.

### Client export

Add a client-scoped export that creates a ZIP containing permitted client
records, project data, inquiries, conversation history, payment records, and
document metadata. Secret values are excluded by default. Documents may be
included only through an explicit export option and an authenticated,
short-lived download. Export creation and download are audited.

### Guided walkthrough

Implement a reusable guided walkthrough after the dashboard shell and before
complex forms:

```text
src/features/admin-tour/
├── content.ts
└── components/
    ├── AdminTour.tsx
    └── HelpTooltip.tsx
```

It includes a global Help/Tour button, first-login tour, highlighted targets,
Back/Next/Skip/Finish, restart support, field examples, contextual `?` help,
keyboard support, screen-reader labels, and reduced-motion behavior. Tour
completion is a UI preference and may initially live in browser storage.

## Feature sequence and completion criteria

### 1. Admin visual foundation

Build the protected dashboard shell UI with placeholder states:

- responsive sidebar and mobile navigation;
- top bar, page headers, breadcrumbs;
- cards, tables, tabs, dialogs, dropdowns, toasts;
- loading, empty, error, and success states;
- keyboard focus and reduced-motion behavior.

Completion: all planned admin routes have a consistent responsive shell that
works at mobile widths, no business/data logic is embedded in layout
components, and TypeScript/build checks pass.

### 2. Guided walkthrough and contextual help

Implement the walkthrough module and connect it to the shell. Add examples for
inquiries, clients, secrets, documents, payments, settings, and health.

Completion: the tour can start, navigate, skip, finish, and restart; complex
fields expose contextual help; keyboard and reduced-motion behavior work.

### 3. Mongoose and server configuration foundation

Install Mongoose and create:

- cached MongoDB connection adapter;
- strict server environment schema;
- reusable Mongoose model pattern;
- explicit connection/configuration errors;
- indexes plan;
- server-only configuration access.

Completion: a safe connection can be established locally, missing/invalid
configuration fails explicitly, models do not recompile during development,
and targeted checks pass.

### 4. Admin authentication and authorization

Implement login, logout, session creation, session lookup, session expiry,
login rate limiting, protected pages, and protected admin route helpers.

Completion: unauthenticated users cannot access admin pages or admin handlers;
valid credentials create a secure HTTP-only session; logout invalidates it;
authentication tests cover success, failure, expiry, and authorization.

### 5. Public contact inquiry storage

Create the `Inquiry` model and update `/api/contact` to persist validated
submissions. Remove public email checks and sending. Build inquiry list,
manual creation, source selection, tags, priority, next action, follow-up date,
search/filter/pagination, detail view, private notes, and statuses:
`new`, `in-progress`, `converted`, `archived`.

Completion: a valid public submission is stored without SMTP; invalid and
rate-limited submissions behave correctly; duplicate retries are idempotent;
Dashboard users can manage the inquiry, source, tags, notes, follow-up fields,
status, and priority. Public submissions start as `new` with `normal` priority;
priority and `converted` status are assigned manually. Manual records are
distinguished from public submissions and do not claim public-form consent.

### 6. Inquiry conversation timeline

Create `ConversationEntry` and support inbound/outbound entries for email,
WhatsApp, phone, meetings, and internal notes. Use editable `occurredAt`
timestamps, server-side channel/direction/text filters, and cursor pagination
for older history.

Completion: an inquiry displays a newest-first manual timeline, late entries
can be placed correctly by date/time, older history is fetched in bounded
pages, and entries are authorized and validated.

### 7. Manual dashboard email replies

Create the dashboard-only reply composer with HTML input, sanitized preview,
plain-text fallback, signature, default template, send state, stored reply
metadata, and outbound conversation entries.

Completion: only authenticated admins can send; SMTP is server-only; success
and failure are explicit; no credential or secret content is logged; public
contact submission never sends email.

### 8. Client management

Create the `Client` model, client list/detail pages, manual creation/editing,
private notes, linked inquiries, tags, “create client from inquiry,” and manual
link, unlink, or relink actions. Keep client fields small.

Completion: client relationships are explicit and reversible, and a client
detail page shows its linked data without leaking unrelated records.

### 9. Project management and tasks

Create `Project` and task records. A project belongs to one client and stores
technical, delivery, repository, environment, production/staging, deadline,
and project notes. Tasks support title, linked resource, status, due date,
priority, notes, and completion metadata.

Completion: project data is separated from the small client profile; tasks and
follow-ups are visible from the relevant inquiry, client, project, and
Overview surfaces; pagination and authorization work.

### 10. Encrypted client secrets

Create client-scoped secret management, client key generation, AES-256-GCM
encryption/decryption helpers, type-specific forms, masking, reveal/copy
re-authentication, expiry/rotation metadata, and audit hooks.

Completion: plaintext never reaches MongoDB/logs/audit records; list/detail
loads never return secret values; reveal/copy requires authorization and
re-authentication; `.env` content is encrypted and download-only.

### 11. Private R2 documents

Configure one private bucket, document metadata, client-scoped upload,
validation, signed preview/download routes, deletion, and failure handling.

Completion: unauthorized users cannot access objects; PDFs/images preview in a
new tab; sensitive/unsupported types download only; signed URLs expire; all
document actions are audited.

### 12. Client payments

Create `PaymentRecord`, payment form and list/detail UI, milestone tracking,
statuses, UTR/reference, totals, notes, and optional R2 proof documents.

Completion: payments are linked to clients, proofs use private document access,
and no prohibited payment credentials can be entered or stored.

### 13. Audit log

Create append-only `AuditEvent` records, a shared sanitizer, filters, search,
pagination, and sensitive-action coverage. Show concise resource labels beside
stable IDs; retain only bounded metadata from an explicit safe-key allowlist.

Completion: authentication, inquiry, client, secret, document, payment,
settings, and email actions are auditable without secret values, passwords,
hashes, contact addresses, or message content. Labels are snapshots so later
resource renames do not make older events harder to identify.

### 14. Private Health page

Add admin-only checks for MongoDB, SMTP configuration/connection, R2, and
required environment variables. Return safe summaries only.

Completion: Health is private, public contact does not call it, credentials and
raw connection details are never shown, and failures are explicit.

### 15. Minimal Settings

Implement admin display information, timezone, date format, email signature,
default reply template, and password-hash generation instructions. Add
contextual `?` explanations.

Completion: timezone/date settings affect display only; email preferences affect
reply defaults; password instructions clearly explain manual Vercel update and
redeploy; generated hashes are not persisted.

### 16. Overview

Build derived metrics and recent data:

- new inquiries: count where status is `new`;
- recent inquiries: latest inquiries across statuses;
- total and active clients;
- secrets expiring soon;
- outstanding payments;
- overdue and upcoming follow-up tasks;
- lead sources and useful tags;
- recent activity.

Completion: metrics are derived from current collections, loading/empty/error
states are handled, and “new” and “recent” are clearly distinct.

The Overview must also include an **Admin actions** panel with short,
actionable instructions:

- review and process new inquiries;
- check overdue follow-ups;
- rotate or review expiring credentials;
- verify MongoDB, SMTP, and R2 health;
- back up MongoDB and verify the backup;
- review recent audit events and failed operations;
- export or offboard client data when a project ends;
- review storage usage and remove unnecessary documents.

Each instruction links to the relevant dashboard page and has a `?` explanation
of when it matters. The panel is guidance, not a pretend automated checklist.

### 17. Client export

Build the authenticated client ZIP export described above, with explicit
inclusion choices, progress/error states, short-lived download access, and
audit coverage.

Completion: an authorized admin can export a complete non-secret client
handover package, optional permitted documents, and metadata without exposing
secret values by default.

Implemented: `POST /api/admin/exports` builds a client-scoped ZIP containing
client, inquiry, conversation, project, task, payment, and document metadata.
Secrets are excluded, documents require an explicit option, and document
contents are downloaded from private R2 only for that option. The ZIP is stored
under a random private R2 key, represented by a short-lived `ExportJob`, and
downloaded through an authenticated short-lived token route. Export creation
is audited. Expired-object cleanup remains part of Step 18 operations work.

### 18. Data handling, retention, recovery, and incident response

After all product features are implemented, stop feature work and make a
separate policy decision for:

- privacy policy and terms updates;
- inquiry, client, secret, document, payment, task, and audit retention;
- soft-delete versus hard-delete behavior;
- restore points and backup frequency;
- MongoDB backup and R2 recovery testing;
- encryption-key backup and rotation;
- client offboarding and credential revocation;
- export and handover procedure;
- breach indicators, alerting, investigation, and notification;
- weekly operational-log archive and deletion;
- storage and free-tier monitoring.

Implement the agreed policy, update public legal documents, and document the
operator runbook. Do not silently invent retention periods during earlier
feature work.

Completion: the policy is approved, implemented, tested with a restore/export
exercise, and reflected in `ARCHITECTURE.md`, public legal pages, and this
file.

## Verification requirements

For every feature:

1. Run targeted tests or checks for the changed modules.
2. Run `npx tsc --noEmit` after TypeScript changes.
3. Run `npm run build` after routing, server, font, dependency, or environment
   changes.
4. Check responsive and keyboard behavior for UI changes.
5. Inspect the diff for accidental secrets, unrelated edits, and missing
   authorization.
6. Update this document and `docs/ARCHITECTURE.md` before marking the feature
   complete.

For UI changes, run the Impeccable detector once over the changed targets after
the UI work is complete:

```bash
/home/company/Projects/nlarge-global-webste/.github/skills/impeccable/scripts/impeccable detect --json <changed-targets>
```

## Post-implementation setup runbook

After implementation is complete, the operator must:

1. Create a MongoDB database and least-privilege application user. Do not use
   an unrestricted root user for the deployed application.
2. Create one private Cloudflare R2 bucket, disable public access, configure
   lifecycle/versioning decisions, and create credentials limited to that
   bucket.
3. Generate and store `ADMIN_SESSION_SECRET` and `MASTER_ENCRYPTION_KEY` in
   the deployment platform's encrypted environment variables. Keep an
   offline recovery copy in an approved secure password manager.
4. Generate `ADMIN_PASSWORD_HASH` locally using the documented project
   command. Never put the plain password in Git, chat, logs, screenshots, or
   the database.
5. Add production environment variables in Vercel, redeploy, and verify login
   from a private browser window.
6. Configure SMTP only for dashboard replies and Health checks. Confirm the
   public contact form succeeds even when SMTP is unavailable.
7. Create MongoDB indexes using the migration/index command documented by the
   implementation. Confirm index creation in MongoDB rather than relying on
   memory or manual guesses.
8. Upload a harmless test PDF and image, test preview/download, then test a
   sensitive `.env` fixture and confirm it is download-only. Remove all fixtures
   afterward.
9. Create a test client, inquiry, project, task, payment, document, and secret;
   verify links, permissions, audit events, and the hold-to-delete behavior.
10. Test MongoDB backup and restore, R2 object recovery, encryption-key recovery,
    client ZIP export, and session revocation before real client data is added.
11. Review the Overview Admin actions panel at least weekly: process inquiries,
    follow up overdue tasks, review expiring secrets, check Health, verify
    backups, review audit/errors, and remove unnecessary data.
12. After a password or key rotation, redeploy and verify that the old value no
    longer authenticates or decrypts data as expected.

The final implementation must include a concise in-dashboard setup checklist
with links to the relevant Settings, Health, Audit, backup, and export pages.

## Manual index and maintenance instructions

The implementation must document the exact index creation command and the
expected indexes for inquiries, clients, projects, tasks, secrets, documents,
payments, audit events, sessions, and conversation entries. The operator will
run that command once per environment and verify it in MongoDB.

Do not add an index manually without recording it in the model and
`ARCHITECTURE.md`. Review slow queries and storage growth during the later data
handling/retention step.

## Later admin-agent automation

After the secure manual dashboard is stable, evaluate an admin-only assistant
that can turn structured pasted instructions into a reviewable draft action,
for example: “Create a project for Acme, add this repository, and set a
follow-up for Friday.”

The assistant must:

- require an authenticated admin session;
- show a proposed mutation before execution;
- require explicit confirmation;
- use existing server modules and validation;
- never reveal secrets in prompts or model responses;
- never autonomously send emails, delete data, or change secrets;
- write an audit event for every approved action.

An MCP server is not required for the first version. MCP should be considered
only if a later assistant must safely call multiple external systems such as
Gmail, GitHub, Vercel, or R2. Start with internal typed tools and explicit
approval; add narrowly scoped MCP adapters only after the threat model and
authorization model are documented.

## Status

Current state: **Step 17 complete; ready for review before Step 18**.

Completed features:

- Admin visual foundation.
- Guided walkthrough and contextual help.
- Mongoose and server configuration foundation.
- Admin authentication and authorization.
- Public contact inquiry storage.
- Inquiry conversation timeline.
- Manual dashboard email replies.
- Client management.
- Project management and tasks.
- Encrypted client secrets.
- Private R2 documents.
- Client payments.
- Audit log.
- Private Health page.
- Minimal Settings.
- Overview.
- Client export.

Next feature:

- Data handling, retention, recovery, and incident response.

## Change log

| Date | Feature | Summary | Verification | Documentation |
|---|---|---|---|---|
| 2026-11-10 | Planning | Created implementation source of truth and handoff instructions. | Not applicable | This file created; architecture update pending implementation. |
| 2026-11-10 | Planning update | Added mobile-first requirements, guided admin actions, hold-to-delete, projects/tasks/follow-ups, manual inquiry sources/tags, bounded logs, client ZIP export, post-implementation retention review, setup runbook, index instructions, and later admin-agent guidance. | Not applicable | This file updated; architecture update remains part of each implementation feature. |
| 2026-11-10 | Engineering reconciliation | Made CSRF, revocable sessions, idempotency, key versioning, R2 consistency, upload validation, HTML sanitization, pagination/indexes, export cleanup, and backup/recovery safeguards explicit. | Markdown diff check passed. | This file updated; architecture update remains part of each implementation feature. |
| 2026-11-12 | Admin visual foundation | Added the responsive `/admin` shell, mobile navigation, shared breadcrumbs, placeholder dashboard states, and planned admin section routes. Authentication and data access remain intentionally deferred to later steps. | `npx tsc --noEmit` passed; `git diff --check` passed; production build was blocked by workspace permission prompt. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Guided walkthrough and contextual help | Added the reusable first-login tour, restart/skip/finish controls, keyboard navigation, reduced-motion-safe UI, target highlighting, and contextual help buttons across admin placeholders. | `npx tsc --noEmit` passed; `git diff --check` passed. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Mongoose and server configuration foundation | Added Mongoose, cached server-only MongoDB connection handling, explicit missing/failed connection errors, reusable model registration, and documented admin/database environment variables. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file, `docs/ARCHITECTURE.md`, `example.env`, `package.json`, and `package-lock.json` updated. |
| 2026-11-12 | Admin authentication and authorization | Added admin login/logout, MongoDB-backed revocable sessions with expiry, HMAC-protected session tokens, login rate limiting, protected admin pages, and same-origin plus CSRF checks for logout. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Public contact inquiry storage | Added the strict Inquiry model, idempotent public submission keys, MongoDB persistence, and updated the contact route/form to validate, rate-limit, save, and return success without SMTP. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Inquiry conversation timeline | Added the strict ConversationEntry model, authenticated inquiry timeline API, inquiry detail page, chronological manual entries, editable occurrence times, and mobile-friendly entry composer. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Manual dashboard email replies | Added an authenticated dashboard-only reply composer, safe escaped HTML/plain-text email generation, SMTP delivery, stored email metadata, and outbound conversation entries. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Client export | Added an authenticated client ZIP export with optional private R2 documents, secret exclusion by default, short-lived download tokens, private R2 storage, and audit coverage. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Client management | Added the small Client model, authenticated client list/create/edit/detail surfaces, linked inquiry display, and reversible inquiry-to-client linking. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Project management and tasks | Added client-owned Project and Task models, authenticated project list/create/edit/detail surfaces, project-scoped task creation, status/priority/due-date fields, and completion metadata. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Encrypted client secrets | Added AES-256-GCM encryption, per-client wrapped data keys, versioned encryption metadata, secret-type forms, metadata-only lists, and password re-authentication before reveal. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file, `docs/ARCHITECTURE.md`, and `example.env` updated. |
| 2026-11-12 | Private R2 documents | Added private S3-compatible R2 storage, metadata records, server-side size/signature validation, random object keys, short-lived signed access, orphan cleanup, and hold-to-delete UI/server confirmation. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file, `docs/ARCHITECTURE.md`, `example.env`, `package.json`, and `package-lock.json` updated. |
| 2026-11-12 | Client payments | Added client-scoped payment records, validated amount/currency/method/status fields, milestones, UTR/reference and paid totals, notes, and optional private proof-document references. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Audit log | Added append-only indexed audit events, request IDs, safe metadata-only records, authenticated audit querying with search/pagination parameters, and coverage across implemented auth, inquiry, client, project, secret, document, payment, task, and email actions. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Private Health page | Added private safe-summary checks for required environment configuration, MongoDB, SMTP, and R2 availability without returning credentials or raw connection details. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Minimal Settings | Added persisted dashboard preferences for display, timezone, date format, signature, and reply template, plus a non-persisted bcrypt password-hash generator with deployment instructions. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |
| 2026-11-12 | Overview | Replaced the placeholder with derived inquiry/client/secret/payment/task/activity metrics, separate new versus recent inquiry views, responsive empty states, and linked Admin actions guidance. | `npx tsc --noEmit` passed; `git diff --check` passed; production build remains pending because workspace permission was previously denied. | This file and `docs/ARCHITECTURE.md` updated. |

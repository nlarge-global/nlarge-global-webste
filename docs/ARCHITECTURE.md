# Application architecture

## Purpose

This repository is the NLarge Global marketing website. Next.js App Router renders the public pages and delegates contact submissions to a server route that validates input and stores inquiries in MongoDB.

## Technology

| Concern | Implementation |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4 and `src/app/globals.css` |
| Fonts | Inter, Cormorant Garamond and Dancing Script through `next/font` |
| Forms | React Hook Form, resolver and shared Zod schema |
| Email | Nodemailer |
| Rate limiting | Optional Upstash Redis REST API with a process-memory fallback |
| Icons | React Icons |

## Folder structure

```text
src/
├── app/
│   ├── (marketing)/              # Marketing pages with transparent route-group URLs
│   │   ├── page.tsx              # /
│   │   ├── products/page.tsx     # /products
│   │   └── services/page.tsx     # /services
│   ├── api/contact/route.ts      # Contact HTTP boundary
│   ├── contact/page.tsx          # /contact
│   ├── support/page.tsx          # /support
│   ├── admin/                    # Private dashboard route surface
│   │   ├── layout.tsx            # Admin shell and admin-only metadata
│   │   ├── login/page.tsx        # Admin login
│   │   ├── prospects/            # Prospect list and detail pages
│   │   ├── page.tsx              # /admin overview placeholder
│   │   └── [section]/page.tsx    # Planned admin section placeholders
│   ├── api/admin/auth/
│   │   ├── login/route.ts        # Login boundary
│   │   └── logout/route.ts       # CSRF-protected logout boundary
│   ├── privacy-policy/page.tsx
│   ├── terms-of-service/page.tsx
│   ├── layout.tsx                # Root layout and metadata
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── layout/                   # Navigation and Footer
│   ├── sections/                 # Route-level presentation sections
│   ├── marketing/                # Reserved for reusable business presentation UI
│   └── ui/                       # Reserved for small reusable interface primitives
├── features/
│   ├── contact/
│   │   ├── api/rate-limit.ts
│   │   ├── components/ContactForm.tsx
│   │   ├── schemas/contact.ts
│   │   └── services/email.ts
│   └── showcase/
│       └── components/
│           ├── ProjectShowcase.tsx
│           └── TestimonialsSection.tsx
│   └── admin/
│       └── auth/
│           ├── rate-limit.ts
│           └── session.ts
│       ├── models/
│       │   ├── inquiry.ts
│       │   ├── conversation-entry.ts
│       │   └── email-record.ts
│       │   ├── prospect.ts
│       │   └── prospect-activity.ts
│       ├── services/
│       │   └── prospect-url.ts
│       ├── client.ts
│       ├── project.ts
│       ├── task.ts
│       ├── secret.ts
│       ├── document.ts
│       ├── payment.ts
│       ├── audit-event.ts
│       └── settings.ts
│       └── components/
│           ├── AdminShell.tsx
│           ├── AdminPlaceholderPage.tsx
│           ├── AdminTour.tsx
│           └── HelpTooltip.tsx
├── content/
│   ├── projects.json
│   └── testimonials.json
├── lib/
│   ├── env.ts
│   ├── mongodb.ts                 # Cached Mongoose connection adapter
│   ├── mongoose-model.ts          # Development-safe model registration
│   └── email/                    # Reserved for a generic email provider boundary
├── styles/
│   └── globals.css
└── utils/
```

## Ownership boundaries

- `app/` owns routing, metadata, layouts and API HTTP behavior.
- `components/layout/` owns elements shared across routes.
- `components/sections/` owns substantial presentation sections reused by page composition.
- `components/marketing/` and `components/ui/` are reserved for genuinely shared presentation primitives rather than route-specific duplication.
- `features/contact/` owns all implementation that is specific to contact enquiries: form UI, validation and SMTP delivery.
- `content/` owns structured local editorial content. It must not contain executable behavior.
- `lib/` owns small infrastructure services shared outside one feature.

## Route map

| Path | Source | Responsibility |
|---|---|---|
| `/` | `src/app/page.tsx` | Marketing proof, showcases, services and team |
| `/services` | `src/app/services/page.tsx` | Services presentation |
| `/products` | `src/app/products/page.tsx` | Product presentation |
| `/contact` | `src/app/contact/page.tsx` | Contact composition |
| `/privacy-policy` | `src/app/privacy-policy/page.tsx` | Privacy policy |
| `/terms-of-service` | `src/app/terms-of-service/page.tsx` | Terms of service |
| `/api/contact` | `src/app/api/contact/route.ts` | Contact submission endpoint |
| `/admin` | `src/app/admin/page.tsx` | Admin overview shell placeholder |
| `/admin/[section]` | `src/app/admin/[section]/page.tsx` | Planned admin section shell placeholders |
| `/admin/prospects` | `src/app/admin/prospects/page.tsx` | Private prospect list, search and follow-up |
| `/admin/prospects/[id]` | `src/app/admin/prospects/[id]/page.tsx` | Prospect details and paginated activity |
| `/admin/login` | `src/app/admin/login/page.tsx` | Admin credential login |
| `/api/admin/auth/login` | `src/app/api/admin/auth/login/route.ts` | Admin login and session creation |
| `/api/admin/auth/logout` | `src/app/api/admin/auth/logout/route.ts` | Revocation with same-origin and CSRF checks |
| `/api/admin/prospects` | `src/app/api/admin/prospects/route.ts` | Authenticated prospect listing and manual creation |
| `/api/admin/prospects/[id]` | `src/app/api/admin/prospects/[id]/route.ts` | Authenticated prospect update and archive |
| `/api/admin/prospects/[id]/activities` | `src/app/api/admin/prospects/[id]/activities/route.ts` | Prospect activity timeline |
| `/api/admin/prospects/share` | `src/app/api/admin/prospects/share/route.ts` | Installed-PWA share target for links |
| `/robots.txt` | `src/app/robots.ts` | Search crawler policy |
| `/sitemap.xml` | `src/app/sitemap.ts` | Public route index |

## Component graph

```mermaid
flowchart TD
    Layout[Root layout] --> Navigation
    Layout --> Page[Route page]
    Layout --> Footer

    Home[Homepage] --> ProjectShowcase
    Home --> TestimonialsSection
    Home --> ServicesSection
    ProjectShowcase --> Projects[(content/projects.json)]
    TestimonialsSection --> Testimonials[(content/testimonials.json)]

    ContactPage[Contact page] --> ContactForm[Contact feature form]
    ContactForm --> ContactSchema[(Shared Zod schema)]
    ContactForm -->|POST /api/contact| ContactAPI[Contact route]
    ContactAPI --> ContactSchema
    ContactAPI --> RateLimit[Redis or memory limiter]
    ContactAPI --> Inquiry[(MongoDB Inquiry)]
```

## Contact request flow

```mermaid
sequenceDiagram
    actor Visitor
    participant Form as ContactForm
    participant API as /api/contact
    participant Email as email service
    participant SMTP

    Visitor->>Form: Submit enquiry
    Form->>Form: Validate shared Zod schema
    Form->>API: POST JSON
    API->>API: Validate shared schema
    API->>API: Check IP rate limit
    API->>Email: sendContactEmails()
    Email->>SMTP: Staff notification
    Email->>SMTP: Visitor confirmation when staff delivery succeeds
    API-->>Form: Success or error response
```

## PWA prospect capture

The manifest launches the installed app on `/admin/prospects` and registers an Android share target. Deploy the site over HTTPS, install it from the browser’s app menu, and sign in before sharing a business link. The share target saves the link immediately as `To review`; if the admin session is missing, sign in and share again. Shared text is retained as notes, source is inferred only for recognized hosts, and no page content is scraped. The dashboard requires a network connection; it does not provide offline access. Archived prospects remain soft-deleted and can be found with the prospects list’s archived filter and restored.

On iPhone, install from Safari’s Share menu using **Add to Home Screen**. iOS does not provide the same installed-web-app share-target behavior, so copy the business link, open Prospects, and add it manually. Follow-up dates are in-dashboard only; there are no device push notifications.

## Configuration

The application reads and validates environment variables through `src/lib/env.ts`.

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `NEXT_PUBLIC_SITE_URL` | No | `https://nlargecorp.com` | Canonical site URL |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP host |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | Use implicit TLS when `true` |
| `SMTP_USER` | Yes for delivery | — | SMTP account and sender |
| `SMTP_PASS` | Yes for delivery | — | SMTP account password or app password |
| `CONTACT_GENERAL_EMAIL` | No | `info@nlargecorp.com` | General/business/careers recipient |
| `CONTACT_SUPPORT_EMAIL` | No | `support@nlargecorp.com` | Support recipient |
| `UPSTASH_REDIS_REST_URL` | No | — | Distributed rate-limit store |
| `UPSTASH_REDIS_REST_TOKEN` | No | — | Distributed rate-limit token |
| `DEV_ALLOWED_ORIGINS` | No | — | Comma-separated Next.js development origins |

See `example.env` for the copyable template.

## Development admin data

After creating a fresh MongoDB database, run `npm run seed:admin` to insert linked demo clients, projects, tasks, inquiries, secrets, documents, and payments. The command creates the two base records plus 30 varied fixture clients, 60 projects, 180 tasks, 90 secrets, 60 documents, 60 payments, and 30 inquiries. Fixtures include boundary dates, long text, unusual Unicode and punctuation, small amounts, mixed statuses, and unassigned inquiries for pagination and UI edge-case testing. The command is explicit and never runs during application startup; it replaces only records with the seed IDs, so it can be run again safely.

## Conventions

- Use kebab-case for directories and TypeScript modules where practical; React component names use PascalCase.
- Use the `@/*` alias for imports under `src/`.
- Client components declare `"use client"` first. Keep browser state below page composition where possible.
- Route files compose features and shared layout; feature-specific behavior stays under `features/<name>/`.
- Public metadata, canonical URLs, robots and sitemap must remain synchronized with public routes.
- Preserve the wine-red (`#602329`), warm-neutral, large-type visual system.
- The admin surface uses the same brand accents with a separate warm-neutral workspace layout. Step 1 contains visual placeholders only; authentication, persistence, and protected operations are added in later features.
- The admin walkthrough and contextual help are client-side UI preferences only during the foundation phase. Tour completion is stored in browser storage until authenticated admin preferences are implemented.
- MongoDB access is server-only through `src/lib/mongodb.ts`; it fails explicitly when `MONGODB_URI` is missing or the connection cannot be established. Models must use `getOrCreateModel()` to avoid development recompilation errors.
- Admin sessions are opaque random cookies whose HMAC is stored in the `AdminSession` collection. Protected pages query the server-backed session, enforce expiry/revocation, and redirect unauthenticated users to `/admin/login`; logout requires a matching same-origin request and constant-time CSRF token comparison.
- Public contact submissions validate with the shared schema, apply rate limiting, persist to the `Inquiry` collection with `source: website`, public origin, recorded consent, and an idempotency key, and do not call SMTP. Manually entered inquiries have manual origin and no public-form consent value; both status and priority are explicitly managed by admins, with new records defaulting to `new` and `normal`. `converted` is a manual status and is never inferred from linking a client.
- Inquiry conversation entries are stored separately from the inquiry, scoped by `inquiryId`, and sorted newest-first by editable `occurredAt` timestamps with cursor pagination. Channel, direction, and text filters are applied by the authenticated API; creation requires CSRF validation. Email reply defaults are loaded from dashboard settings only when the reply dialog opens.
- Dashboard replies are the only current path that uses SMTP. Reply text is escaped before HTML generation, includes a plain-text fallback, stores delivery metadata in `EmailRecord`, and creates an outbound `ConversationEntry`.
- Client records stay small and inquiries reference an optional `clientId`. Linking, unlinking, and relinking are authenticated server operations; client detail pages query only their linked inquiries.
- Prospects are separate from inbound inquiries. They support URL-only capture, explicit status, source, notes and in-dashboard follow-up dates; activity is stored separately and cursor-paginated. The installed PWA manifest receives Android share actions at `/api/admin/prospects/share`; capture requires an active admin session and accepts only HTTP(S) URLs. No scraping or device push notifications are used.
- Projects belong to exactly one client and contain technical/delivery details. Tasks are separate records linked to projects (and inherit the client), with indexed status and due-date fields for later overview and follow-up views.
- Client secrets use a unique client data key wrapped by `MASTER_ENCRYPTION_KEY`; secret values store only ciphertext, IV, authentication tag, and key version. Lists exclude encrypted fields, and reveal requires admin re-authentication.
- Client documents use private R2 object keys under `clients/{clientId}/documents/...`; uploads validate size, declared type, and file signature, while access uses five-minute signed URLs. Metadata and object deletion are coordinated with orphan cleanup on metadata failure.
- Payments are client-scoped records with bounded amount/currency/method/status fields and optional references to private proof documents. Payment credentials are not accepted by the schema.
- Audit events are append-only, indexed by time and resource, and carry a bounded request ID, a sanitized resource-label snapshot, and metadata filtered through an explicit safe-key allowlist. Stable resource IDs remain available for exact tracing; new writes exclude credentials, hashes, contact details, message bodies, and request payloads, and audit readers filter legacy metadata through the same allowlist.
- Health checks are private and return only configured/ok/error summaries for environment, MongoDB, SMTP, and R2. Public contact submission does not call Health.
- Settings are a single dashboard preference record. Password hash generation returns a bcrypt hash once and never persists the plaintext or hash. Password generation, login, and re-auth reject passwords longer than bcrypt's 72-byte input limit.
- Overview metrics are derived from current collections and do not have a separate collection. New inquiries use `status: new`, while recent inquiries use creation order across statuses; task/payment/secret signals use indexed collection queries.
- Client exports are created through authenticated `POST /api/admin/exports`, exclude secret values, and optionally include private R2 document contents. ZIPs use random private object keys and short-lived `ExportJob` download tokens; creation is audited, while expired-object cleanup is deferred to the Step 18 operational policy.

# Agent guide

## Work here

- This is a Next.js 16 App Router website using React 19, TypeScript, Tailwind CSS 4 and Nodemailer.
- Read [architecture](docs/ARCHITECTURE.md) before cross-cutting changes; it maps routes, components, data and request flows.
- Use the existing `@/*` TypeScript alias for imports under `src/`.
- Route pages live in `src/app/**/page.tsx`; shared UI lives in `src/components/layout/` and `src/components/sections/`; feature UI lives in `src/features/`; static structured content lives in `src/content/*.json`.
- Keep homepage composition in `src/app/page.tsx`; reuse `Navigation` and `Footer` on public pages instead of recreating them.
- Preserve the wine-red (`#602329`), warm-neutral, large-type visual system and responsive editorial layouts unless a task explicitly replaces the design.

## Commands

```bash
npm run dev
npm run build
npm start
```

## Contact flow

The public form posts to `/api/contact`. Validation belongs in both the page and route. Email delivery is centralized in `src/features/contact/services/email.ts`; route policy and HTTP rate limiting stay in `src/app/api/contact/route.ts`. Validation is shared through `src/features/contact/schemas/contact.ts`. SMTP credentials are environment variables described in the architecture document.

## Change checks

- Run `npx tsc --noEmit` after TypeScript changes and `npm run build` when routing, metadata, server code, fonts or dependencies change.
- Check desktop and mobile behavior for any layout change; reduced-motion and keyboard behavior are required for interactive UI.
- Do not publish invented reviews, metrics, clients or government-project claims.
- Keep metadata, sitemap entries, robots policy and public navigation aligned when adding or removing routes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent guide

## Work here

- This is a Next.js 15 App Router website using React 19, TypeScript, Tailwind CSS 4 and Nodemailer.
- Read [architecture](docs/ARCHITECTURE.md) before cross-cutting changes; it maps routes, components, data and request flows.
- Use the existing `@/*` TypeScript alias for imports under `src/`.
- Route pages live in `src/app/**/page.tsx`; shared UI lives in `src/components/`; static structured content lives in `src/constants/*.json`.
- Keep homepage composition in `src/app/page.tsx`; reuse `Navigation` and `Footer` on public pages instead of recreating them.
- Preserve the wine-red (`#602329`), warm-neutral, large-type visual system and responsive editorial layouts unless a task explicitly replaces the design.

## Commands

```bash
npm run dev
npm run build
npm start
```

## Contact flow

The public form posts to `/api/contact`. Validation belongs in both the page and route. Email delivery is centralized in `src/lib/email.ts`; route policy and HTTP rate limiting stay in `src/app/api/contact/route.ts`. SMTP credentials are environment variables described in the architecture document.

## Change checks

- Run `npx tsc --noEmit` after TypeScript changes and `npm run build` when routing, metadata, server code, fonts or dependencies change.
- Check desktop and mobile behavior for any layout change; reduced-motion and keyboard behavior are required for interactive UI.
- Do not publish invented reviews, metrics, clients or government-project claims.
- Keep metadata, sitemap entries, robots policy and public navigation aligned when adding or removing routes.

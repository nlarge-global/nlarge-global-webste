# NLarge Global website

Marketing website for NLarge Global, built with Next.js App Router, React, TypeScript and Tailwind CSS.

## Documentation

- [Architecture and system map](docs/ARCHITECTURE.md) — routes, component graph, request flow, configuration and known constraints.
- [AGENTS.md](AGENTS.md) — concise repository rules for coding agents.
- [Product context](PRODUCT.md) — brand commitments and product positioning.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Contact email

Configure `SMTP_USER` and `SMTP_PASS` before using the contact form. Optional recipients and SMTP settings are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Validation

```bash
npx tsc --noEmit
npm run build
```

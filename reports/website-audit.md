# Lighthouse audit — www.nlargecorp.com

**Audited:** 17 November 2026, live production site (not the local build).
**Tool:** Lighthouse 13.6.0, headless Chrome 157, run locally against the public URL.
**Profiles:** mobile = Moto G Power emulation + simulated Slow 4G (Lighthouse default); desktop = Lighthouse desktop preset.
**Raw output:** `reports/lh-mobile.{json,html}`, `reports/lh-desktop.{json,html}`, `reports/lh-services-mobile.*`, `reports/lh-contact-mobile.*`

> PageSpeed Insights itself was unavailable (its anonymous daily quota returned HTTP 429), so these are equivalent local Lighthouse runs. No CrUX field data was available for this report — all numbers are lab data.

## Scores

| Page | Profile | Performance | Accessibility | Best practices | SEO |
|---|---|---:|---:|---:|---:|
| `/` | mobile | **90** | **92** | **92** | **100** |
| `/` | desktop | **87** | 92 | 92 | 100 |
| `/services` | mobile | **99** | 96 | 92 | 100 |
| `/contact` | mobile | **96** | 96 | **73** | 100 |

## Core metrics

| Metric | `/` mobile | `/` desktop | Target |
|---|---:|---:|---|
| FCP | 2.1 s | 0.8 s | < 1.8 s |
| LCP | 2.6 s | 1.8 s | < 2.5 s |
| TBT | 70 ms | 0 ms | < 200 ms |
| CLS | 0 | 0 | < 0.1 |
| Speed Index | **5.5 s** | **2.4 s** | < 3.4 s |
| TTFB (root doc) | 480 ms | 470 ms | < 800 ms |
| Transfer, mobile `/` | ~1.17 MB in 28 requests | ~1.23 MB in 40 requests | — |

**Strengths.** SEO is a clean 100 on every page: titles, descriptions, canonical URLs, crawlable links, robots and sitemap are all correct. CLS is 0 and TBT is 0–70 ms, so the layout is stable and the main thread is quiet. HTTPS, HSTS, CSP, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy` are all present, and the apex domain 308-redirects to `www`. Structured data (Organization, Person, WebSite, Service) is in place.

**The headline.** The homepage carries one asset that dominates everything else: `public/images/device-mockup1.svg` is **1.07 MB on disk and ~751 KiB over the wire**, and it is the hero image (the LCP element). It is a Figma SVG export with three base64 rasters embedded in it, so it is effectively an uncompressed photo that gzip cannot shrink (764 KB compressed). `/services` and `/contact` score 96–99 precisely because they don't load it.

---

## Fix first (P0)

### 1. Replace the 1 MB hero SVG with a real raster image
- **Where:** `public/images/device-mockup1.svg` (1,075,844 bytes), used at `src/features/showcase/components/DeviceShowcase.tsx:80`.
- **Problem:** 751 KiB transfer, 773 ms resource load, and it gates the visible hero. The SVG contains three embedded bitmaps (`data:image` × 3), which is why compression does nothing.
- **Fix:** export the mockup as WebP/AVIF at ~1920 px wide (`/images/device-mockup.webp`), or split the three screen images out as separate files. Realistically 100–200 KB instead of 751 KB.
- **Expected:** removes ~600–650 KB from the homepage and should pull Speed Index down sharply.

### 2. Stop lazy-loading the hero image and give it fetch priority
- **Where:** `DeviceShowcase.tsx:70` (the `device-mockup-preview.webp` placeholder) and `:78` (the SVG).
- **Problem:** Lighthouse names the preview image as the LCP element and flags it directly: `loading="lazy"` and no `fetchpriority=high`. LCP breakdown: TTFB 1,650 ms → **resource load delay 1,071 ms** → load 773 ms.
- **Fix:** add `priority` to the hero `<Image>` (Next emits `fetchpriority="high"` and drops `loading="lazy"`). Keep the tiny 4.7 KB placeholder eager too if it is the first paint.
- **Expected:** ~1 s off LCP on mobile; LCP should land near 1.4–1.7 s.

### 3. Turn off Cloudflare Email Address Obfuscation
- **Evidence:** the live HTML contains `data-cfemail`, `/cdn-cgi/l/email-protection` and `email-decode.min.js`; Lighthouse reports a React hydration error and a CSP violation caused by it.
- **Problem:** Cloudflare rewrites the `mailto:` text server-side, React then hydrates different text → `Minified React error #418` on every page, plus `email-decode.min.js` blocked by `script-src 'self' 'unsafe-inline'` (`next.config.ts`). It also breaks the `mailto:` links for visitors without JS.
- **Fix:** Cloudflare dashboard → Scrape Shield → Email Address Obfuscation → off. Nothing in the codebase needs to change.

### 4. Unblock or remove Cloudflare Web Analytics
- **Problem:** `https://static.cloudflareinsights.com/beacon.min.js` is injected at the edge and blocked by the CSP in `next.config.ts` — a second console error and the `inspector-issues` failure on every page.
- **Fix:** either add `https://static.cloudflareinsights.com` to `script-src` and `https://cloudflareinsights.com` to `connect-src`, or disable Web Analytics in Cloudflare. Do the same for `/cdn-cgi/scripts/...` if Email Obfuscation stays on.

### 5. `/contact` best practices = 73: Cloudflare's challenge script
- **Evidence:** `deprecations` flags `Fenced Frame API` and `StorageType.persistent` inside `/cdn-cgi/challenge-platform/scripts/jsd/main.js`; the contact page also carries 180 ms TBT versus 70 ms on the homepage.
- **Fix:** this is Cloudflare Bot Fight Mode / JS detections, not site code. Disable JS detections for public marketing pages if the score matters more than the challenge; otherwise accept 73 on this one URL.

---

## Accessibility (92–96, all pages)

These are small, mechanical fixes with no design impact:

1. **Footer label contrast — 3.94:1, needs 4.5:1.** `src/components/layout/Footer.tsx:78` and `:99` use `text-black/50` at 10.4 px. Change to `text-black/70` (≈8.6:1) — this is the only contrast failure on every page.
2. **Star rating has an illegal `aria-label`.** `src/features/showcase/components/TestimonialsSection.tsx:136` puts `aria-label="4 out of 5 stars"` on a plain `<div>`. Add `role="img"` alongside it.
3. **Logo link name mismatch.** `src/components/layout/Navigation.tsx:43` sets `aria-label="NLarge Global home"` while the visible text is "NLarge Global" — screen-reader users who use voice control can't match it. Drop the `aria-label` (the visible text is already a good name) or make the label start with the visible text.
4. **Service cards on `/services`.** `src/features/services/components/ServiceExplorer.tsx:59` uses `aria-label={\`View details for ${service.name}\`}`, which omits the card's visible heading. Lead with the visible text, e.g. `aria-label={`${service.name} — view details`}`. This repeats for all 12 cards.
5. **Duplicate `id="testimonials-title"`.** `TestimonialsSection.tsx` renders two `<h2>`s with the same id (the second is `sr-only`). Invalid HTML and ambiguous `aria-labelledby`; give the second heading its own id or keep one heading.

## Non-blocking findings

- **Unused webfont.** `Dancing_Script` is loaded in `src/app/layout.tsx:22` (3 weights) but `--font-dancing` is never referenced anywhere in the codebase — one wasted font file and request on every page. Removing it is free.
- **Fonts total ~127 KB across 3 families** (48 + 42 + 37 KB). Cormorant Garamond requests 5 weights; trimming to the weights actually used in `src/styles/globals.css` would save more.
- **Logo PNG.** `logo-transparent.png` is 52 KB and got served at `w=256` for 40 KB. An SVG or WebP logo would be ~5–10 KB, and it is requested twice per page (header + footer).
- **Legacy JavaScript, ~14 KB** of polyfills in one chunk — Next's default browser target; low priority.
- **Unused JavaScript, ~25 KB** in `1fi8up7j304vd.js`. Low priority; mostly framework/runtime.
- **TTFB ~470 ms** with `x-vercel-cache: HIT` behind Cloudflare. Fine, but the double proxy hop plus a `sin1` Vercel region for an India-focused audience is worth revisiting if TTFB matters later.
- **`<meta name="msvalidate.01">` sits inside the homepage `<div>` body** (`src/app/(marketing)/page.tsx`), which is invalid placement. Move it to `metadata.verification.other` in `layout.tsx` or the route metadata.

## Expected outcome

Not measured — these are estimates from the audit's own byte/ms figures. Fixes 1–3 alone take the homepage from ~1.17 MB to roughly 400–500 KB and should move mobile LCP from 2.6 s to ~1.5 s and Speed Index from 5.5 s to ~2.5–3 s, i.e. mobile Performance into the mid-90s. Fixes in the accessibility list take Accessibility from 92 to 100.

## Reproducing

```bash
npx --yes @puppeteer/browsers install chrome-headless-shell@stable --path ./.lighthouse/chrome
CHROME_PATH="$PWD/$(ls .lighthouse/chrome/chrome-headless-shell/*/chrome-headless-shell-linux64/chrome-headless-shell)" \
  npx --yes lighthouse https://www.nlargecorp.com/ \
  --output=html --output=json --output-path=reports/lh-mobile \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new --no-sandbox" --quiet
# add --preset=desktop for the desktop profile
```

Re-audit after deploying the fixes; lab numbers vary a few points between runs, so compare LCP/Speed Index/transfer size rather than the single score.

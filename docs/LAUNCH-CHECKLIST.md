# Launch and post-launch checklist

This checklist covers the remaining owner/provider steps for publishing the site. Cloudflare, Vercel, DNS, Search Console, and Analytics are not configured by repository changes.

## Completed in the repository

- The canonical URL defaults to `https://nlargecorp.com` in `src/lib/site.ts`. Set the same value in Vercel's Production environment and redeploy.
- Public pages use canonical metadata and the sitemap uses the non-`www` host.
- One branded 1200 x 630 social preview image is used by public pages.
- The site says it is based in Rajasthan, India, and serves clients worldwide. No city or street address is published.
- Four public guides are linked from navigation and the footer: website maintenance, codebase handover, slow websites, and redesign/new feature planning.
- Sitemap `lastmod` values reflect the known content dates.
- The app's own `robots.txt` allows all crawlers. Cloudflare's edge policy is a separate setting described below.
- No unverified social profile URLs, Analytics tag, advertising tag, NRI school credit, or client logo were added.
- The PWA icon PNGs were palette-optimized; the 512px icon was visually checked. The removed DRDO project image is not part of the site.

## Before deploying

1. Review the final changes and push/merge the approved branch to GitHub.
2. In Vercel, confirm the production project is connected to the expected repository and branch.
3. In **Project Settings → Environment Variables**, set the Production value:

   ```env
   NEXT_PUBLIC_SITE_URL=https://nlargecorp.com
   ```

   This is a public URL, not a secret. The site uses it when creating canonical URLs, structured data, and the sitemap, so redeploy after changing it.
4. Confirm the production environment has the required server-side values from `example.env` (database, admin security, and SMTP). Add R2 settings only if the feature is used. Never put secret values in GitHub or public build variables. Protect Preview deployments and do not expose production secrets to untrusted previews. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` if contact rate limiting must be shared across serverless instances.
5. In Vercel's domain settings, make `nlargecorp.com` the primary domain and verify the configured DNS records with the values Vercel shows. Do not guess or copy DNS targets from old instructions.
6. In Cloudflare, make permanent redirects preserve the path and query:
   - `https://www.nlargecorp.com/<path>` → `https://nlargecorp.com/<path>`
   - `http://nlargecorp.com/<path>` → `https://nlargecorp.com/<path>`
   - `http://www.nlargecorp.com/<path>` → `https://nlargecorp.com/<path>`

   Configure each redirect in one place (Cloudflare Redirect Rules or Vercel), not as conflicting rules in both. Use a permanent 301/308 redirect and verify that no rule loops.
7. In **Cloudflare → SSL/TLS → Overview**, use **Full (strict)** only after confirming the Vercel origin presents a valid HTTPS certificate for the configured hostname. Cloudflare's [Full (strict) guidance](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/) explains the certificate requirements.
8. Enable multi-factor authentication on GitHub, Vercel, Cloudflare, and the domain registrar. Restrict production secrets and administrative access to the people and services that need them.

## Cloudflare crawler and robots settings

The app's `src/app/robots.ts` emits a wildcard allow rule and the sitemap URL. Cloudflare can add its managed AI crawler policy at the edge; do not edit the app file to fight that managed policy.

In the Cloudflare dashboard for `nlargecorp.com`:

1. Open **Security → Settings** and filter for **Bot traffic**.
2. Open **AI Crawler and Agent access policies**.
3. Set **Search** to **Allow (do not block)**.
4. Set **Agents** to **Allow (do not block)**.
5. Set **Training** to **Disallow**.
6. Enable **Bot Preference Sync** if shown, then save.
7. After deployment, open `https://nlargecorp.com/robots.txt` and verify the sitemap line and the intended Search/Agent/Training directives. Also confirm Cloudflare's edge policy is not challenging or blocking verified search crawlers.

Cloudflare documents these controls in [AI Crawler and Agent access policies](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/) and [robots.txt setting](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/). Robots directives express a preference; Cloudflare edge policy is what can enforce its crawler controls.

## After deployment: smoke-test the live site

Run these checks from a terminal or browser after DNS and deployment have settled:

```bash
curl -sSIL https://www.nlargecorp.com/softwares
curl -sSIL https://nlargecorp.com/products
curl -sSIL http://nlargecorp.com/services
curl -sSIL http://www.nlargecorp.com/guides
curl -sSI https://nlargecorp.com/og-image.png
curl -sS https://nlargecorp.com/robots.txt
curl -sS https://nlargecorp.com/sitemap.xml
```

Confirm the first URL redirects to `/softwares` and the old `/products` URL redirects there permanently; the next two URLs finish at the corresponding `https://nlargecorp.com/...` URL. The image should return `200` with `image/png`, robots should name the canonical sitemap, and the sitemap should contain the four guide URLs and `/softwares`. Open the homepage, services, softwares page, all guides, contact, support, and legal pages on desktop and a phone. Submit a real contact enquiry and confirm staff notification and visitor confirmation arrive. Do not use a real customer's sensitive data for this test.

Check HTTPS/TLS and response security headers on the deployed pages, including HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and Content Security Policy. The app sets these in `next.config.ts`; verify they survive the Cloudflare/Vercel path and that the CSP does not break the form or page. Confirm the admin login and protected admin routes require authentication; `robots.txt` and `noindex` are not access controls.

For social previews, verify `https://nlargecorp.com/og-image.png` loads and inspect a shared link in the relevant social platform preview/debug tool. A preview may be cached by the social platform.

## Search Console: keep the existing data

Do **not** delete or reset existing Search Console properties.

1. Add a **Domain property** for `nlargecorp.com` in [Google Search Console](https://search.google.com/search-console).
2. Verify it by adding Google's DNS TXT record at the domain's DNS provider. Preserve existing DNS records.
3. Keep the existing URL-prefix properties; the Domain property also covers `www`, HTTP, and HTTPS.
4. Submit `https://nlargecorp.com/sitemap.xml` under the Domain property after the canonical redirects work.
5. Use URL Inspection on `/`, `/services`, `/softwares`, `/guides`, and each new guide. Check Google's selected canonical, crawl/index status, and request indexing for the new guides if appropriate.
6. Review Page indexing, Manual actions, Security issues, and Performance reports periodically. Allow for reporting/indexing delays; submission does not guarantee indexing or rankings.

The supplied six-month Search Console export (May 15–November 14, 2026) reported 9 clicks and 869 impressions. The `nlarge` query accounted for 8 clicks and 705 impressions. The homepage had 6 clicks/473 impressions; `/products` had 3/522; `/services` had 0/2. The report listed the homepage on the apex host but product/service URLs on `www`, reinforcing the need to normalize redirects and canonical URLs. It also showed 513 impressions from the Faroe Islands; do not infer intended market demand from that row alone—review future country/query/page combinations after canonicalization.

Google says its normal SEO fundamentals apply to AI Overviews and AI Mode; no special AI file or schema guarantees appearance. Keep the guides useful and accurate, link them from relevant pages, make important content visible in HTML, and avoid unsupported claims. See [Google's AI features guidance](https://developers.google.com/search/docs/appearance/ai-features).

## Optional after launch: Analytics and social identity

Analytics is not installed. If you want visitor behavior and enquiry tracking:

1. Create a GA4 property and web data stream for `https://nlargecorp.com`.
2. Choose one installation method (Google tag or Google Tag Manager); don't install both.
3. Track successful contact submissions only after the server confirms success, and test in GA4 Realtime/DebugView.
4. Decide whether you need a consent banner before enabling Analytics or advertising tags. Review the privacy policy and requirements for visitors' locations. No advertising cookies/tags are installed by this implementation.

When you are ready, provide the exact public URLs for official profiles you control (LinkedIn, Instagram, GitHub, or an eligible Google Business Profile). Add only verified URLs to `sameAs` in the Organization JSON-LD in `src/app/layout.tsx`. Do not invent profile URLs. A Google Business Profile should only be created/used if the business meets Google's eligibility rules and its location/service-area details are truthful.

## Optional authority work: NRI Public School credit

The school does not need to publish proof of permission. Keep the school's written approval privately; visitors see only the credit/link the school approves. Do not publish a school logo, screenshots, a detailed case study, or a footer credit without permission for those exact uses.

You can ask the school by email:

> Would NRI Public School be comfortable adding “Website by NLarge Global” with a link to https://nlargecorp.com in the website footer? Please let me know whether we may also show selected screenshots and describe our work on our portfolio. We will publish only the wording and materials you approve.

If approved, retain the reply, confirm the final wording and destination URL, then add the credit only in the placement approved. The link can provide attribution and a useful public reference, but no backlink or directory listing guarantees improved rankings. GoodFirms, Clutch, and DesignRush listings are optional; use consistent, accurate details and genuine reviews only.

## Ongoing checks

- Monthly: review Search Console queries/pages/countries and qualified enquiries; compare non-brand searches separately from brand searches.
- Monthly: check Cloudflare security events, contact delivery, backups, admin access, and any production errors.
- After meaningful content edits: update only that route's sitemap `lastmod` to the actual content-change date. Do not touch it for code-only, styling-only, or metadata-only changes.
- Add guide topics only when there is a specific reader question, verified answer, and a useful internal link to a relevant service. No posting schedule is required for launch.

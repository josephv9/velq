# Weekly SEO Report, 2026-08-03

Executed locally (the scheduled cloud routine's first run produced no output; likely a repo push-access issue, see Operational notes).

## Summary

Full on-page audit of all 11 pages, two site-level fixes shipped (homepage head tags and www redirect), no new page published this week because batch 1 is not yet indexed. The single highest-impact next step is owner action: verify the domain in Google Search Console and submit the sitemap.

## Pages published this week

None. The keyword map forbids creating batch 2 pages until batch 1 is indexed, and batch 1 is not indexed yet (see below). The only otherwise-unblocked candidate remains `/guides/clear-protein-vs-protein-shakes/`.

## Audit results

Audited: homepage, product page, guides hub, all 8 guides, sitemap.xml, robots.txt, .htaccess, plus live HTTP behavior.

Clean across the board: titles and meta descriptions in range, exactly one H1 per page, valid Article/FAQ/Breadcrumb JSON-LD on every guide (HowTo on the mixing guide), Product schema without review markup on the product page, all internal links resolve, every guide links to the product page plus 2 to 4 sibling guides and a waitlist CTA, sitemap lists all 11 URLs, robots.txt correct, 404s return real 404 status, http redirects to https.

Issues found and fixed this week:

1. Homepage rendered-DOM head was bare. The raw HTML crawlers fetch has a complete head (description, canonical, OG, Organization JSON-LD), but the loader script replaces the whole document with the bundle template at load time, and the template head had none of those tags. Google renders JavaScript when indexing, so its rendering pass saw a homepage with no canonical or meta at all. The template head now carries the exact same description, canonical, OG/Twitter tags and JSON-LD as the shell (bundle checks pass).
2. `https://www.velqnutrition.com/` served the full site with 200 instead of redirecting, a duplicate-content risk made worse by the missing homepage canonical. Added a 301 www-to-apex redirect in .htaccess.
3. Two leftover em dashes in the homepage bundle (a feature-card divider glyph, now a middot, and a "no delivery date" placeholder in the subscription portal script, now "Not scheduled").

Observation, not changed: product page title is 66 characters, slightly long; only the trailing "| Velq" risks truncation in search results.

## Indexation status

Not indexed. `site:velqnutrition.com` returns nothing, and exact-title searches for the guides return no velqnutrition.com results. The site is new, has no known backlinks, and has never been submitted to Google, so this is expected but is now the bottleneck for everything else.

## Metrics not available

Google Search Console metrics, rankings, backlink counts, and waitlist signup numbers were not checked; no GSC or analytics access is connected to this workflow yet.

## Blocked items and what unblocks them

| Item | Blocker | Owner action needed |
|---|---|---|
| Indexation and all GSC reporting | Domain not verified in GSC | Verify velqnutrition.com in Google Search Console (DNS TXT record via Hostinger), submit sitemap.xml, request indexing for homepage and product page |
| `/guides/clear-protein-vs-protein-shakes/` | Batch 1 not indexed | None beyond GSC above; publish once batch 1 pages appear in search |
| `/guides/clear-protein-powder-without-sucralose/` | Sweetener system unconfirmed | Confirm the final sweetener system |
| `/guides/building-the-velq-formula/` | Needs real founder testing notes and photos | Provide genuine formula-testing material; cannot be fabricated |
| Weekly GSC/rankings/waitlist reporting | No connectors | Connect Google Search Console (and analytics if available) at claude.ai/customize/connectors |

## Recommended next actions

1. Owner: GSC verification plus sitemap submission (biggest lever, 15 minutes).
2. Owner: Bing Webmaster Tools verification (free, imports from GSC, also feeds DuckDuckGo and AI search engines).
3. Next run: re-check indexation; publish the clear-protein-vs-shakes guide the week batch 1 appears in search.
4. Soon: start one link magnet from the strategy (the mixability test across 15 to 20 products is the strongest candidate) since zero backlinks will otherwise cap rankings on every target keyword.

## Operational notes

The "Velq weekly SEO" cloud routine fired 2026-08-03 18:48 UTC and produced no branch, PR, or commits after 3+ hours. Check the session log at claude.ai/code/routines/trig_014VLM4NbBy9iwha3fLyqunQ; the likely cause is missing push access to github.com/josephv9/velq from the cloud environment.

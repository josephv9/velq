# Velq — Google AI, Bing/Copilot and visual discovery

Release date: 20 October 2026, Pacific Time.

## Scope and implementation

This release improves how the existing Velq site exposes its original research,
calculator explanations, approved imagery and editorial covers to search and AI
discovery systems. It does not create additional keyword landing pages or change
the development-stage status of the Velq formula.

| Area | Change |
|---|---|
| Image discovery | The generated sitemap retains 47 canonical page URLs and expands from one image entry on one page to 35 image entries across 31 pages. The obsolete redirected homepage image alias is replaced by current responsive image URLs. |
| Page previews | An explicit image map sets absolute Open Graph/Twitter image URLs, descriptive image alternatives, image type and verified physical dimensions on 31 existing pages. |
| Structured metadata | Existing WebPage/CollectionPage primary images and Article/BlogPosting/WebApplication images describe the current page visuals. JSON-LD remains consistent with visible content; no reviews, product offers, licenses or video facts are invented. |
| Visual explanations | Both calculators gain a 1200 × 675 original arithmetic illustration, scalable SVG counterpart, accessible alt text and an adjacent HTML explanation. All hypothetical numbers match their existing worked examples. |
| Crawl controls | Existing robots restrictions, canonical URLs, publication dates, page content, responsive image sources and signup behavior are preserved. Large image previews are allowed only when no conflicting directive exists. |
| Bing/IndexNow | A standard-library Python utility validates explicit changed canonical URLs, the existing public verification key, robots directives and page responses before an optional submission. Dry run is the default; real receipt status is recorded separately. |

## Public destinations

- [Serving comparison calculator](https://velqnutrition.com/tools/serving-comparison-calculator)
- [Cost per serving calculator](https://velqnutrition.com/tools/nutrition-label-value-calculator)
- [Original gummy serving study](https://velqnutrition.com/research/gummy-serving-study-2026)
- [Media and citation resources](https://velqnutrition.com/media)
- [Generated sitemap](https://velqnutrition.com/sitemap.xml)

The serving illustration compares fictional A (5 g fiber across two gummies,
2.5 g each) and fictional B (6 g across three gummies, 2 g each). The cost
illustration compares fictional A ($24 / 12 servings = $2 per serving) and B
($30 / 30 servings = $1 per serving), then distinguishes standardized nutrient
costs. These are arithmetic examples, not actual labels, current prices, product
rankings, dose recommendations or clinical findings.

## Implementation boundaries

`discovery-extension.php` runs after the existing research, authority, image and
responsive-source filters. It operates only on the explicit page/image map and
the sitemap. The plain static fiber-powder article is normalized at source because
its Apache route bypasses the PHP dispatcher. The research generator and dated
source dataset are unchanged. No new frontend JavaScript is needed for the figures.

The image sitemap includes only existing canonical pages and actual visible or
linked assets. Article research dates are not refreshed for metadata edits. Later
genuine calculator modification dates are preserved. No special AI schema,
`llms.txt`, video sitemap or fabricated VideoObject is introduced.

To rebuild the original diagrams, run:

```bash
MPLCONFIGDIR=/tmp/velq-matplotlib python3 scripts/build-discovery-guides.py
```

To inspect, then submit a subsequent set of genuinely changed pages:

```bash
python3 scripts/submit-indexnow.py --urls-file changed-urls.txt --receipt preflight.json
python3 scripts/submit-indexnow.py --submit --urls-file changed-urls.txt --receipt submission.json
```

Do not use recurring blanket sitemap submissions. HTTP 200 means the endpoint
received the URLs; HTTP 202 means key validation remains pending. Neither proves
indexing or AI citations. The release manifest is
`2026-10-20-discovery-changed-urls.txt`.

## Validation and release evidence

Before deployment, local checks cover PHP syntax, actual rendered page metadata,
JSON-LD parsing, sitemap namespaces and preservation of canonical pages and dates.
The focused discovery gate verifies idempotence, actual mapped images, restricted
robots directives and unchanged unrelated responses. Existing checks cover packed
assets, commercial page links, calculator arithmetic, HTTP route behavior,
confirmed-signup attribution, responsive images and the single GA4 initializer.

Deployment, public page/image response checks and IndexNow receipt evidence are
recorded separately after publication. Code validation does not establish search
index inclusion, search impressions, AI citations or actual GA4 receipt.

The repository's older CLAUDE.md mentions deployment from `site`. Current evidence
from the Milestone 3 release and this preflight confirms production contains
`main`'s media/authority changes that are absent from `site`. Publishing uses the
current source branch and is followed by public verification; the older deployment
branch is not overwritten.

## Account-dependent verification

The GSC Wizard connection returned `subscription_required` for both Search Console
and Bing site enumeration. No account data was retrieved. Velq's effective Google
AI inclusion setting, Bing property verification, current indexed-page count,
Google AI/multimodal impressions and Bing citation totals remain unverified.

### Google AI and multimodal discovery

In Search Console, select the verified Velq property and inspect **Settings →
Search generative AI**. Confirm its effective setting includes the site's links
and content, including inherited parent controls. Google documents inclusion as
the default; this release does not assume the actual account setting.

Use **Generative AI performance report (Search)** to inspect impressions by page
and date for **Web: text-based** and **Web: multimodal**. The latter includes Lens,
Circle to Search, uploaded images and Chrome image search. A report may be absent
when impressions are insufficient or the property is excluded. Also inspect the
ordinary image-search performance report and URL Inspection for relevant pages.

### Bing/Copilot

In Bing Webmaster Tools, select the verified Velq site and open **AI Performance**.
Record total citations, average cited pages, page-level citation activity and
sampled grounding queries. These cover supported Copilot, Bing AI and partner
experiences; they are not ranking positions or complete counts of all AI exposure.
Keep sitemap processing, URL Inspection and IndexNow receipts separate from actual
citation evidence.

### Conversion measurement

Use GA4's native **Session default channel group = AI Assistant**, plus **Session
source / medium**, with the `waitlist_signup_success` event. Google AI Overviews
and AI Mode remain in Organic Search in GA4; use Search Console's dedicated AI
report for their visibility. The existing auxiliary `entry_referrer_type` remains
unchanged and should not be represented as a new AI-reporting dimension.

Count `waitlist_signup_success` once per confirmed new signup. Do not sum equivalent
lead events as separate conversions. Native acquisition reporting does not require
a new custom dimension; this release does not verify GA4 key-event designation or
receipt. Origin-only or missing referrers limit attribution.

## Official references checked for this release

- [Google AI features and site eligibility](https://developers.google.com/search/docs/appearance/ai-features)
- [Google generative AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google image search guidance](https://developers.google.com/search/docs/appearance/google-images)
- [Search generative AI inclusion control](https://support.google.com/webmasters/answer/16908024?hl=en)
- [Google Generative AI performance report](https://support.google.com/webmasters/answer/16984139?hl=en)
- [Bing AI Performance report](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/)
- [IndexNow submission and response specification](https://www.indexnow.org/documentation)
- [GA4 default channel definitions](https://support.google.com/analytics/answer/9756891?hl=en)

Technical eligibility, submission receipt, index inclusion, AI citation, referral
traffic and confirmed signup conversion are separate outcomes. Unavailable account
measurements are unknown, not zero.

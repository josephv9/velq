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

### Published release and live verification

Implementation was merged through [PR #25](https://github.com/josephv9/velq/pull/25)
as commit `0748ea973470b42c06360863480c4064b55bc8f3` and verified on production
on 20 October 2026. The release passed its pull-request check and all five
automatically triggered checks after merging.

| Live check | Observed result |
|---|---|
| Canonical page responses | All 47 sitemap pages returned HTTP 200 with one matching canonical URL and no detected restrictive indexing or snippet directive. |
| Mapped image metadata | All 31 mapped pages returned the exact published absolute image URL, dimensions, descriptive alternative and large-card metadata. |
| Sitemap coverage | 47 unique canonical pages; 35 image entries across 31 pages, representing 32 unique sitemap image URLs. |
| Image responses | All 34 checked image assets returned valid image responses; declared primary-image dimensions matched the decoded files, and local file bytes matched deployed bytes where available. The total includes primary preview assets outside the sitemap's 32 unique images. |
| Serving calculator | The live worked example returned 2.5 g fiber per piece for fictional A and 2 g for fictional B. The original illustration loaded at 1200 × 675 and was inspected in its page context. |
| Cost calculator | The live worked example returned $2 and $1 per complete serving, and standardized costs of $2 and $1.25 respectively. The 1200 × 675 illustration and adjacent explanation were inspected in their page context. |
| IndexNow | One batch containing 31 unique changed canonical URLs returned HTTP 200 at 20:26:38 UTC (13:26:38 Pacific). The existing public verification key matched, and all submitted pages passed robots and canonical preflight checks. |

Evidence is retained in the
[public verification record](2026-10-20-discovery-public-verification.json),
[IndexNow receipt](2026-10-20-discovery-indexnow-receipt.json),
[serving-page screenshot](2026-10-20-serving-discovery-live.jpg), and
[cost-page screenshot](2026-10-20-value-discovery-live.jpg).

GitHub checks on the deployed commit all passed:

- [Prelaunch checks](https://github.com/josephv9/velq/actions/runs/39491854506)
- [Homepage LCP release check](https://github.com/josephv9/velq/actions/runs/39491854444)
- [Real browser GA4 validation](https://github.com/josephv9/velq/actions/runs/39491854441)
- [Mocked waitlist and GA4 browser QA](https://github.com/josephv9/velq/actions/runs/39491854456)
- [Live sitemap and mobile performance audit](https://github.com/josephv9/velq/actions/runs/39491854503)

HTTP 200 from IndexNow confirms receipt of the submitted batch. It does not
establish search-index inclusion, search impressions, AI citations or referral
traffic. Passing the analytics checks does not establish receipt in Velq's GA4
account or key-event designation.

The repository's older CLAUDE.md mentions deployment from `site`. Current evidence
from the Milestone 3 release and this preflight confirms production contains
`main`'s media/authority changes that are absent from `site`. Publishing uses the
current source branch and is followed by public verification; the older deployment
branch is not overwritten.

## Direct platform verification

Workflow preference confirmed on 20 October 2026: Velq no longer uses GSC Wizard.
Use Google Search Console and Bing Webmaster Tools directly for account reporting,
through authorized native access or reports exported from those platforms. The
published discovery improvements and direct IndexNow submission utility have no
GSC Wizard dependency; renewing that subscription is not a prerequisite.

The release audit did not retrieve Google or Bing account data, and direct account
verification has not yet been completed. Velq's effective Google AI inclusion
setting, Bing property verification, current indexed-page count, Google
AI/multimodal impressions and Bing citation totals remain unverified. This is a
remaining verification task, not a site failure caused by a missing subscription.

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

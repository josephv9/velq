# Velq Milestone 3 — research, serving comparisons and calculators

Published 20 October 2026. Scope: original label research and reusable tools that help Velq compete for relevant search rankings and citations.

## Deliverables

| Canonical URL | Delivered work |
|---|---|
| `https://velqnutrition.com/research` | Research and calculator discovery hub |
| `https://velqnutrition.com/research/gummy-serving-study-2026` | Seven-product label audit, complete serving tables, per-gummy analysis, chart, methods, source notes, citation-copy action and dated CSV/JSON downloads |
| `https://velqnutrition.com/tools/serving-comparison-calculator` | Two-product comparison per labeled serving, piece, portion and optional 100 calories; six calculable manufacturer presets plus an explicit missing-count case |
| `https://velqnutrition.com/tools/nutrition-label-value-calculator` | Existing value-calculator URL upgraded with explicit calculation, clear examples, error handling and missing-versus-zero semantics |
| `https://velqnutrition.com/blog/protein-gummies-with-fiber-comparison` | Existing comparison updated to current Cutfruit, Kuma and OAKA source labels, with unavailable PROTEDY figures removed from current calculations |

The source snapshot is `assets/research/gummy-labels-2026-10-20.json`. `python3 scripts/build-research-pages.py` reproduces both research pages, the CSV and the SVG chart from it. The optional `--chart-png` flag renders the social image with matplotlib. The original observation timestamp is retained; running the generator does not reverify sources or change the date.

## Evidence and research boundaries

Manufacturer sources were inspected on 20 October 2026. Four fiber-gummy examples publish 5–7.5 g dietary fiber in the selected serving of two or three gummies. Their normalized range is approximately 1.67–2.5 g fiber per gummy. Three selected protein-gummy labels each publish 20 g protein per pouch and 3.5–5 g fiber. Verified counts are 12 for Cutfruit and 10 for Kuma; the inspected OAKA pouch count remains unverified.

Every public row has a product variant, source URL, observation time, evidence type and notes. Missing numeric fields are null, while OLLY's less-than-1-g protein bound is stored without inventing an exact amount. Velq development targets and unavailable PROTEDY live-source figures are excluded. No product was bought or laboratory-tested for this study, and no ingredient efficacy, protein quality, clinical outcome or market-average claim is made.

Sources: [Metamucil](https://www.metamucil.com/en-us/products/gummies/metamucil-gummies), [Benefiber](https://www.benefiber.com/fiber-supplement-products/benefiber-prebiotic-fiber-gummies/), [vitafusion](https://vitafusion.com/products/fiber-well-sugar-free-gummy-vitamin-90-gummies-vf06581), [OLLY](https://www.olly.com/products/fiber), [Cutfruit](https://cutfruit.co/), [Kuma](https://www.kumasupps.com/product), [OAKA](https://oakanutrition.com/products/oaka-protein-gummies). Exact panel URLs are retained in the dataset and displayed on the study page.

## Implementation and analytics

The allowlisted PHP dispatcher serves the five canonical pages with canonical redirects and proper GET/HEAD responses. The output filter adds 36 contextual study/tool links across 12 active dynamic pages and updates the existing generated sitemap. New assets use external CSS/JavaScript to comply with the site's CSP. The study contains Article/Dataset/DataDownload metadata, and calculators expose WebApplication metadata.

Successful, explicit calculator submissions emit `calculator_complete`; identical repeated submissions are deduplicated. Deliberate file actions emit `research_download`, and successful citation copies emit `citation_copy`. Custom event parameters include only allowlisted tool/content identifiers and input mode; raw inputs and product names are not sent. These are engagement events. `waitlist_signup_success` remains the primary server-confirmed signup event, and research paths now survive the existing attribution sanitizer.

## Validation evidence

- PHP lint passed for the dispatcher, response extension and modified output filter.
- Calculator arithmetic, fractional portions, zero versus missing data, bounded presets, invalid/nonfinite inputs, privacy and completion deduplication passed.
- Integration tests passed for all five routes, canonical aliases, query preservation, GET/HEAD/405/404, CSP, preview noindex, standalone comparison precedence, sitemap integrity and research-to-homepage signup attribution.
- Existing commercial SEO, gummy SEO, packed-site, GA4 initializer, responsive-image and waitlist attribution/origin checks passed.
- Local Chrome browser QA passed all 16 page/viewport combinations: four new/upgraded research/tool pages at widths 375, 390, 768 and 1440 pixels. No horizontal page overflow, duplicate element IDs or browser exceptions were observed. Preset calculations, missing-count rejection, worked examples, mobile navigation, citation copy and CSV download were checked.
- Browser QA blocked external tracking and signup requests. Test events and mocked confirmations do not establish GA4 receipt or real lead creation.

## Deployment and outcome status

Implementation and production publication are complete. [PR #23](https://github.com/josephv9/velq/pull/23) merged into main at [`5d83e087a60ea47476534baa45318bc814e6e9b8`](https://github.com/josephv9/velq/commit/5d83e087a60ea47476534baa45318bc814e6e9b8). The complete uploaded tree matched the staged, tested files. The [pull-request validation run](https://github.com/josephv9/velq/actions/runs/39482712897) and [post-merge prelaunch checks](https://github.com/josephv9/velq/actions/runs/39482815337) passed, including the reproducible dataset generation gate.

At 12:23 p.m. Pacific on 20 October 2026 (19:23 UTC), public HTTPS checks passed for all 15 requested resources: the five canonical pages, eight research assets, sitemap and analytics script. The five pages returned HTTP 200 with the intended canonical URLs and milestone content. All eight public assets matched the release bytes, including CSV, JSON, chart files, styles and scripts. The live sitemap contains the three new URLs, and the deployed analytics sanitizer accepts research paths. Exact checks are recorded in [the deployment evidence](2026-10-20-milestone3-public-verification.json).

An actual browser then loaded both production calculators. Selecting OLLY and Metamucil presets and a one-piece portion produced 2.5 g and 1.67 g fiber per gummy, respectively, while preserving unknown protein values. Keyboard submission of the value calculator's clearly fictional worked example produced $2.00 versus $1.00 per serving and $2.00 versus $1.25 per 10 g protein and per 5 g fiber. The [live comparison screenshot](velq-milestone3-serving-live-20261020.jpg) records the displayed results. No signup was submitted during these production checks; GA4 property receipt was not inspected.

Main's existing public lead-capture and Milestone 2 assets matched the current deployment before release; the older site branch lacked the deployed source set. Concurrent popup QA and Milestone 2 report commits were preserved. Publication through main is now independently confirmed by the live milestone assets.

Current Google index inclusion, rankings, search traffic, earned citations and actual GA4 property receipt cannot be inferred from passing code or browser tests. No new ranking or citation outcome is claimed here.

The keyword map records distinct page intentions. Assess nonbranded impressions, clicks, CTR and position over 14–28 days after indexing, alongside genuine referring-domain citations and organic `waitlist_signup_success` conversions. These measurements remain separate from technical completion.

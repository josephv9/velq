# Velq Milestone 2 — Commercial Keyword / URL Map

Updated 2026-10-19. Product scope: **prelaunch strawberry protein + prebiotic fiber gummies only**. Final nutritional amounts, price and availability are not verified finished-label facts.

The keyword assignments below are **search-intent targets**, not proven rankings, search volumes, or traffic estimates. Keep one primary page per distinct search job.

| Primary target query | Canonical destination | Visitor decision |
|---|---|---|
| strawberry protein and fiber gummies, Velq gummies | `/` | Learn about Velq and join the free launch waitlist |
| protein gummies with fiber, protein fiber gummies comparison | `/blog/protein-gummies-with-fiber-comparison` | Compare current Cutfruit, Kuma and OAKA labels; disclose unavailable PROTEDY source and Velq development status |
| best fiber gummies 2026 | `/blog/best-fiber-gummies-2026` | Explore the disclosed, label-based buyer shortlist, separating buy-now brands from prelaunch Velq |
| protein and fiber gummies buying guide | `/blog/protein-and-fiber-gummies-buying-guide` | Apply the ingredient, serving, caffeine, allergen and cost checklist |
| protein gummies vs protein bars | `/blog/protein-gummies-vs-protein-bars` | Decide between two portable formats and distinguish a snack from a supplement |
| fiber gummies vs psyllium husk | `/blog/fiber-gummies-vs-psyllium-husk` | Compare the named fiber ingredient and product-specific water directions |
| fiber powder vs gummies | `/blog/fiber-gummies-vs-fiber-powder` | Compare format, full serving and cost without assuming identical fiber effects |
| protein gummies vs separate supplements | `/blog/protein-and-fiber-gummies-vs-separate-supplements` | Assess ingredient/dose control against a combined formula |
| protein gummies for adults | `/blog/protein-gummies-for-adults` | Adult product-suitability checklist; not another ranking |
| fiber gummies for adults | `/blog/fiber-gummies-for-adults-guide` | Ingredient/tolerance education; not another branded shortlist |
| cost per gummy serving | `/tools/nutrition-label-value-calculator` | Calculate cost using actual package price and labeled servings |
| how much dietary fiber per day | `/blog/how-much-fiber-do-you-need-every-day` | General education; link into commercial guides only when relevant |
| protein and fiber snack ideas | `/guides/protein-and-fiber-snacks` | Food-first snack choices; optional links to gummy guides |

## Applied internal-link route

The Milestone 2 response filter in `image-patch.php` now introduces a small "Compare before you choose" path on **10 existing canonical pages**: the comparison hub, guides hub, fiber-gummy shortlist, direct protein-and-fiber comparison, general gummy checklist, bars comparison, psyllium comparison, combined-vs-separate comparison and both adult suitability guides.

Each journey links to exactly three related *existing* pages and uses meaningful buyer-oriented anchor text. `assets/velq-commercial-m2.css` provides responsive presentation without inline styles. The fiber-powder article already links into the buyer journeys; do not duplicate its current related-content panel.

The page response filter adds no signup logic. It preserves `waitlist_signup_success` as the meaningful server-confirmed signup event, preserves the prelaunch disclaimer, and labels the waitlist as **not a preorder**.

## Measurement and acceptance

- Baseline from the 2026-10-13 report (data through October 11): branded **velq**: 63 Google impressions / 3 clicks; relevant nonbranded **fiber powder vs gummies**: 1 impression / 0 clicks. This is historical, sparse data, not a current rank.
- Without authenticated Google Search Console performance data, current average position, total indexed pages and page-level ranking changes are **not verified**. Never invent keyword difficulty, ranking positions or search volume.
- After deployment, use the **free** Google Search Console Performance → Search results view with a 28-day window; record query, matching URL, impressions, clicks, CTR and average position. Prioritize relevant nonbranded query/page pairs ranking positions approximately **4–20** after enough impressions accrue.
- In GA4, evaluate Organic Search `waitlist_signup_success` after a real, server-confirmed signup. October 20 onward is the first clean measurement period after October 19 conversion rule cleanup. Do not count CTA clicks or earlier contaminated key-event totals as leads.
- Review two weeks after the pages are recrawled. A successful code deployment does **not** by itself establish Google indexing, ranking improvements, real-user performance or confirmed organic signups.

## Integrity limits

Velq is not selling lemonade powder, protein drinks, electrolyte powders or stand-alone caffeine gummies. Product targets and package visuals are previews until the final label is verified. Do not invent competitor data, independent tests, reviews, health outcomes, product prices or referral conversion counts.

Retired powder-product pages must remain omitted from navigation/sitemap and keep their existing HTTP 410 responses. Retain the fiber powder **comparison** because it serves a legitimate adjacent buying question.

Avoid near-duplicate doorway pages and paid Google Search Console tooling. Improve existing content based on measured impressions, then revisit underperforming canonical pages.

## Milestone 3 — original research and serving tools (2026-10-20)

These are intent assignments, not measured search volumes, rank forecasts or guaranteed citations.

| Primary target query | Canonical destination | Distinct visitor job |
|---|---|---|
| protein and fiber gummy research, gummy label data | `/research` | Find original datasets and related free tools |
| fiber per gummy, protein gummy serving size comparison | `/research/gummy-serving-study-2026` | Inspect dated primary-source evidence, per-serving/per-piece analysis, methods and downloadable data |
| gummy serving size calculator, protein per gummy calculator | `/tools/serving-comparison-calculator` | Calculate two exact labels per serving, piece and entered portion; use source-backed presets |
| cost per serving calculator, fiber supplement cost calculator | `/tools/nutrition-label-value-calculator` | Compare current user-entered package costs using the established calculator URL |
| protein gummies with fiber, Cutfruit vs Kuma serving | `/blog/protein-gummies-with-fiber-comparison` | Read the updated commercial comparison and open the corresponding source presets |

The study uses seven selected manufacturer-published product versions: four fiber gummies and three protein gummies. Six rows have a verified piece count; missing or bounded fields remain unavailable for exact arithmetic. Velq targets and unavailable PROTEDY source data are excluded. This is original descriptive label analysis, not laboratory or clinical research.

The research module adds 36 contextual links across 12 active dynamic pages. The existing comparison is served from its updated plain HTML source; its older packed copy is not the public source for that canonical route. `Dataset`, `Article`, `DataDownload`, `WebApplication` and breadcrumb metadata describe the real public content. The dated CSV/JSON and stable study URL support accurate citation.

Measurement: `calculator_complete` records only a successful explicit submission, deduplicating identical calculations. `research_download` records a deliberate CSV/JSON click; `citation_copy` records a successful copy. These engagement events are not signup conversions. The existing primary conversion remains `waitlist_signup_success`, with research landing-page and article context preserved through the homepage journey. Inputs and product names are not added to custom analytics event parameters.

After indexing, compare the new query/page pairs over 14–28 days using nonbranded impressions, clicks, CTR and average position. Assess actual referring domains and citations to the study URL and attributable organic signups separately. Deployment and valid structured data do not establish ranking gains, Google Dataset Search inclusion or earned citations.

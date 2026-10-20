# Velq Milestone 2 — Commercial keyword research and measurement record

Recorded: **2026-10-19**. Only Velq product: prelaunch strawberry protein + prebiotic fiber gummies. Its final label, price and availability remain unverified.

## Verified deployment

- [Milestone 2 code change](https://github.com/josephv9/velq/pull/22) merged as `3d0f45f04d6b6d0dad9ecada5ce6c9a435f94717`; GitHub prelaunch and post-merge checks passed.
- All ten canonical buyer/comparison pages were checked on live `https://velqnutrition.com`; each has one responsive “Compare before you choose” section and three related contextual links. Total: 30 links.
- Live pages expose self-canonical indexable metadata; this does **not** prove Google has indexed them.

## Measurement blocker — verified

- Connected GSC Wizard tool refuses data because the trial/subscription has expired. Do not infer zero clicks or zero ranking.
- The existing free tracker at `https://docs.google.com/spreadsheets/d/1Rfft7Go7Ln-hgI8cV6F-LVInDt7GV8a0MYuC2A-JLHQ/edit` has **not** completed Google Apps Script authorization: Overview says awaiting authorization and Queries/Pages/Daily tabs are empty.
- No authenticated GA4 account report here verifies organic `waitlist_signup_success` receipt, even though technical browser tests passed. GA4 event instrumentation is not the same as verified GA4 conversions.
- Historical GSC reference from `reports/2026-10-13-ai-visibility-growth-baseline.md`, for 28 settled days through October 11: branded `velq` 63 impressions / 3 clicks; observed nonbranded query `fiber powder vs gummies` 1 impression / 0 clicks. **Not** a current ranking, and **not** all nonbranded traffic.

## Exactly 50 search-intent candidates

These **hypothetical query phrasings** are not observed Search Console queries, volumes, ranks or keyword-difficulty scores. `A` = closer purchase/research intent and topical fit, `B` = related decision support. Existing canonical page only: never create one doorway page per phrase.

| # | Candidate query | Existing canonical target | Intent priority |
|---:|---|---|:---:|
| 1 | protein gummies with fiber | `/blog/protein-gummies-with-fiber-comparison` | A |
| 2 | best protein and fiber gummies | `/blog/protein-gummies-with-fiber-comparison` | A |
| 3 | protein gummies with prebiotic fiber | `/blog/protein-gummies-with-fiber-comparison` | A |
| 4 | protein and fiber gummy brands | `/blog/protein-gummies-with-fiber-comparison` | A |
| 5 | protein gummies with fiber for adults | `/blog/protein-gummies-with-fiber-comparison` | A |
| 6 | best fiber gummies 2026 | `/blog/best-fiber-gummies-2026` | A |
| 7 | best prebiotic fiber gummies | `/blog/best-fiber-gummies-2026` | A |
| 8 | best sugar free fiber gummies | `/blog/best-fiber-gummies-2026` | A |
| 9 | fiber gummy brands compared | `/blog/best-fiber-gummies-2026` | A |
| 10 | fiber gummies with most fiber per serving | `/blog/best-fiber-gummies-2026` | A |
| 11 | protein and fiber gummies buying guide | `/blog/protein-and-fiber-gummies-buying-guide` | A |
| 12 | how to choose protein gummies with fiber | `/blog/protein-and-fiber-gummies-buying-guide` | A |
| 13 | low sugar protein and fiber gummies | `/blog/protein-and-fiber-gummies-buying-guide` | A |
| 14 | prebiotic fiber and protein gummy ingredients | `/blog/protein-and-fiber-gummies-buying-guide` | A |
| 15 | strawberry protein fiber gummies | `/blog/protein-and-fiber-gummies-buying-guide` | A |
| 16 | Cutfruit vs PROTEDY protein gummies | `/blog/protein-gummies-with-fiber-comparison` | A |
| 17 | Cutfruit protein gummies fiber | `/blog/protein-gummies-with-fiber-comparison` | A |
| 18 | PROTEDY protein gummies fiber | `/blog/protein-gummies-with-fiber-comparison` | A |
| 19 | Kuma vs OAKA protein gummies | `/blog/protein-gummies-with-fiber-comparison` | A |
| 20 | OAKA protein gummies fiber | `/blog/protein-gummies-with-fiber-comparison` | A |
| 21 | protein gummies vs protein bars | `/blog/protein-gummies-vs-protein-bars` | B |
| 22 | protein gummy or protein bar | `/blog/protein-gummies-vs-protein-bars` | B |
| 23 | protein gummies versus bars for travel | `/blog/protein-gummies-vs-protein-bars` | B |
| 24 | protein gummies compared to high protein snacks | `/blog/protein-gummies-vs-protein-bars` | B |
| 25 | protein gummy versus bar per serving | `/blog/protein-gummies-vs-protein-bars` | B |
| 26 | fiber gummies vs psyllium husk | `/blog/fiber-gummies-vs-psyllium-husk` | B |
| 27 | psyllium husk versus prebiotic fiber gummies | `/blog/fiber-gummies-vs-psyllium-husk` | B |
| 28 | psyllium fiber gummies versus powder | `/blog/fiber-gummies-vs-psyllium-husk` | B |
| 29 | fiber gummies psyllium ingredient comparison | `/blog/fiber-gummies-vs-psyllium-husk` | B |
| 30 | prebiotic gummies vs psyllium | `/blog/fiber-gummies-vs-psyllium-husk` | B |
| 31 | fiber powder vs gummies | `/blog/fiber-gummies-vs-fiber-powder` | A |
| 32 | fiber gummies or powder | `/blog/fiber-gummies-vs-fiber-powder` | A |
| 33 | fiber gummies vs fiber powder cost | `/blog/fiber-gummies-vs-fiber-powder` | A |
| 34 | fiber supplement powder versus gummies | `/blog/fiber-gummies-vs-fiber-powder` | A |
| 35 | fiber powder vs gummy serving size | `/blog/fiber-gummies-vs-fiber-powder` | A |
| 36 | protein and fiber gummies vs separate supplements | `/blog/protein-and-fiber-gummies-vs-separate-supplements` | B |
| 37 | combined protein fiber gummies vs individual supplements | `/blog/protein-and-fiber-gummies-vs-separate-supplements` | B |
| 38 | all in one protein and fiber gummy | `/blog/protein-and-fiber-gummies-vs-separate-supplements` | B |
| 39 | protein gummy plus fiber supplement comparison | `/blog/protein-and-fiber-gummies-vs-separate-supplements` | B |
| 40 | combined protein and fiber supplement vs separate | `/blog/protein-and-fiber-gummies-vs-separate-supplements` | B |
| 41 | protein gummies for adults | `/blog/protein-gummies-for-adults` | B |
| 42 | adult protein gummy serving size | `/blog/protein-gummies-for-adults` | B |
| 43 | whey protein gummies for adults | `/blog/protein-gummies-for-adults` | B |
| 44 | collagen protein gummies vs whey gummies | `/blog/protein-gummies-for-adults` | B |
| 45 | protein gummies with caffeine for adults | `/blog/protein-gummies-for-adults` | B |
| 46 | protein gummies cost per gram protein | `/tools/nutrition-label-value-calculator` | B |
| 47 | fiber gummies cost per gram fiber | `/tools/nutrition-label-value-calculator` | B |
| 48 | protein gummies serving size comparison | `/tools/nutrition-label-value-calculator` | B |
| 49 | compare fiber gummies nutrition facts | `/tools/nutrition-label-value-calculator` | B |
| 50 | gummy supplements price per serving calculator | `/tools/nutrition-label-value-calculator` | B |

## Search and lead acceptance gates

| Condition | Evidence / state |
|---|---|
| Deployment / SEO code | COMPLETE — 10 live modules, 30 contextual links, CI pass |
| Candidate keyword map | COMPLETE — 50 **editorial** hypotheses assigned to existing pages |
| Actual query/page performance baseline | BLOCKED — free GSC tracker needs owner Google authorization |
| Rank improvement / nonbranded click lift | UNVERIFIED — future settled post-rollout data required |
| GA4 leads from Google organic | UNVERIFIED — genuine server-confirmed `waitlist_signup_success` must appear in the relevant GA4 reporting property |

## Free 14- and 28-day review protocol

1. On a computer, complete the Google owner consent flow documented in the existing Free SEO Tracker **Setup** tab: Extensions → Apps Script, install the supplied script files and run `setupVelqTracker`. Confirm Setup B10 `Connected`, daily trigger in B11, and populated Query / Page rows before claiming data is active.
2. For post-rollout reporting use the last **settled** 28 days and an equal immediately preceding period, recording nonbranded queries and canonical landing pages: clicks, impressions, CTR, average position. Google data is delayed; the 14-day checkpoint cannot yet contain 28 fully post-rollout days. Report that constraint rather than claiming full-period causality.
3. In GA4 for stream G-F93RK1P0H5, verify a **real consented new signup** yielded one received `waitlist_signup_success`. Report `google / organic` session-to-signup attribution by landing page if the dimensions exist. Do not count `generate_lead`, clicks and form starts as additional signups.
4. Compare GSC nonbranded landing-page visibility with GA4 organic confirmed signup counts. Do not equate their distinct attribution methodologies or sum hidden-query rows into site totals.
5. The growth tracker demands before/after click, CTR and confirmed lead evidence. Mark implementation complete, but do not set Milestone 2 `DONE` until these outcome acceptance criteria are demonstrably met.

No paid SEO applications, new product URLs, or waitlist/consent changes are needed for this checklist.

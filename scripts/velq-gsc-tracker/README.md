# VELQ — Free Search Console + GA4 organic and signup tracking

Google Sheet: https://docs.google.com/spreadsheets/d/1Rfft7Go7Ln-hgI8cV6F-LVInDt7GV8a0MYuC2A-JLHQ/edit

This is a **free** Google Apps Script workflow. No GSC Wizard or third-party subscription is necessary. The same spreadsheet records Google Search Console impressions/clicks and GA4 organic sessions plus real confirmed early-access leads (`generate_lead`).

## One-time activation (Google account that owns Search Console)

1. Open the linked Google Sheet in a **desktop browser**.
2. Choose **Extensions → Apps Script**.
3. Delete the starter contents of `Code.gs`. Copy and paste the complete contents of [Code.gs](./Code.gs) into that editor tab.
4. In Apps Script **Project Settings** (gear), enable **Show appsscript.json manifest file in editor**. Select the `appsscript.json` file in the editor and replace its contents with the [provided manifest](./appsscript.json).
5. **Save**. Select `setupVelqTracker` in the function picker and click **Run**. Approve the Google sign-in prompts with the Google account that can read Search Console **and** GA4 for Velq. Approve the read-only Google Analytics scope.
6. Return to the Google Sheet: **Setup!B10** should say `Connected — successful data refresh`, **B11** should say `Active — daily near 8 AM Pacific`, and **B13** should report GA4. **B14** will show the seven-page Google URL Inspection status. The **GA4 Organic** tab shows Organic Search sessions, confirmed organic leads, and confirmed total leads for two aligned 28-day windows.
7. If automatic GA4 property discovery cannot find web stream `G-F93RK1P0H5`, enter its **numeric** GA4 Property ID (not the G- measurement ID) into **Setup!B12**, then select **VELQ SEO → Refresh GA4 only**. If prompted, enable the Google Analytics Admin API and Google Analytics Data API in the Apps Script Cloud project. No paid plan is needed.

## What the script tracks

* **Overview** — last 28 finalized days against the previous 28: total clicks, impressions, CTR and average position.
* **Daily** — up to 120 days of organic clicks, impressions, CTR and average position.
* **Queries** — leading searches where your site appears.
* **Pages** — leading pages visible in Google Search.
* **Query Pages** — query and matching page together.
* **Devices** — desktop, mobile and tablet results.
* **Opportunities** — queries with at least 25 impressions and average position 3–30 for SEO review.

Google Search Console data usually arrives with a delay; this script queries dates ending about **3 days ago**. Query-level data may omit anonymized queries and does not always sum to the site-wide total; the summary is fetched independently. Opportunities are prioritized candidates, not promised gains.

## Troubleshooting

* **Ownership not verified / HTTP 403**: visit https://search.google.com/search-console and verify `https://velqnutrition.com/`, then make sure Apps Script uses that Google account.
* **API not enabled / HTTP 403**: enable the Google Search Console API in the Google Cloud project associated with Apps Script, if Google requests it.
* **Permissions prompt**: grant read-only Search Console permission, write permission to the current spreadsheet, and trigger management. No passwords or API keys need to be shared with ChatGPT.
* **No rows**: very new sites or properties may have no settled Search Console data yet; wait a few days and refresh again using the `VELQ SEO` menu.

The script reads Search Console and GA4 via their native Google APIs and writes aggregated results into this spreadsheet. It never exports email addresses or customer records, and it does not send data to an external analytics provider. GA4 organic attribution is **session-channel-based** and should not be confused with Search Console clicks; signups are counted only after server-confirmed `generate_lead` events.

## GA4 reporting definitions

- **Organic Search sessions** are sessions GA4 attributes to its `Organic Search` default session channel on the main site (`velqnutrition.com` or `www.velqnutrition.com`, excluding the Shopify storefront).
- **Organic confirmed leads** count `generate_lead` events in Organic Search sessions. The Velq site emits these only after the waitlist API confirms a signup; no raw emails are sent.
- **All-channel confirmed leads** count the same `generate_lead` events regardless of channel (on the main site only).
- **Lead / session rate** = confirmed organic leads / Organic Search sessions. These are event counts rather than deduplicated customers.
- Google Search Console clicks/impressions and GA4 sessions can differ due to processing, cookie settings and measurement definitions. Values remain unavailable until the account owner runs Apps Script once and grants Google permissions.

## Verified Google indexing (after authorization)

The **Indexing** tab uses Google's official URL Inspection API, not a `site:` search guess. It inspects the homepage, consumer protein/fiber/caffeine pages, product page, and wholesale landing page once daily. Google returns the *last indexed version* rather than a live crawl; new site updates can take time to appear. `PASS` generally means indexed; `NEUTRAL` means excluded; `FAIL` means index error. Each row also records Google canonical, robots state and last crawl time. A failed/unauthorized inspection remains marked **API error (not verified)**, never mislabeled as indexed. To refresh manually, choose **VELQ SEO → Inspect Google indexing**.

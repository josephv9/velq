# VELQ — Free Google Search Console tracking

Google Sheet: https://docs.google.com/spreadsheets/d/1Rfft7Go7Ln-hgI8cV6F-LVInDt7GV8a0MYuC2A-JLHQ/edit

This is a **free** Google Apps Script workflow. No GSC Wizard or third-party subscription is necessary.

## One-time activation (Google account that owns Search Console)

1. Open the linked Google Sheet in a **desktop browser**.
2. Choose **Extensions → Apps Script**.
3. Delete the starter contents of `Code.gs`. Copy and paste the complete contents of [Code.gs](./Code.gs) into that editor tab.
4. In Apps Script **Project Settings** (gear), enable **Show appsscript.json manifest file in editor**. Select the `appsscript.json` file in the editor and replace its contents with the [provided manifest](./appsscript.json).
5. **Save**. Select `setupVelqTracker` in the function picker and click **Run**. Approve the Google sign-in prompts with the same Google account that owns `https://velqnutrition.com/` in Search Console.
6. Return to the Google Sheet, open the **Setup** tab, and confirm cell **B10** says `Connected — successful data refresh` and **B11** says `Active — daily near 8 AM Pacific`.

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

The script only reads Search Console data and writes it into this spreadsheet. It does not send the data to an external analytics provider.

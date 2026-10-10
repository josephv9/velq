# Velq bright premium staging review

Branch: `staging/velq-bright-premium`, based on main commit `d81869f0d57a4d745d6753401375d32cf9504ea3`.

## Design
Warm white surfaces, lemon hero and ingredient accents, strawberry-red calls to action, consistent sans-serif headings, rounded product and story cards, and roomier touch targets. The desktop product card places artwork beside product information; phone layouts stack these elements. The supplied packaging image remains fully visible rather than cropped. The shared stylesheet also updates Journal surfaces.

## Implementation
`velq-site.php` is the active entry point specified by `.htaccess`. Its embedded `/style.css` now appends the reviewable `design/bright-premium.css`. Run `python scripts/apply-bright-premium.py` after editing that stylesheet. No dependencies or build step were added.

Existing homepage copy, all eleven articles and category pages, calculator, product artwork, canonical tags, structured data, sitemap, robots directives, analytics and waitlist logic are unchanged. Legacy Shopify product, guide and legal pages remain untouched. The legacy self-unpacking `index.html` remains intact.

## Validation
- `python scripts/check-bright-premium.py`: verifies all 30 non-CSS bundled assets are identical to the base commit; PHP routing/security/Shopify CSP and API proxy code are unchanged; existing stylesheet is retained; reapplication is idempotent.
- `node scripts/check-bundles.js`: all four legacy bundle JSON blocks pass.
- `git diff --check`: passes.

Browser preview tooling and PHP runtime are unavailable in this workspace. Visual rendering and PHP HTTP behavior were not tested. Before approval, review 320/390px phones, 768/1024px tablets, and 1440/1920px desktops; check full packaging visibility, menus, FAQ, privacy dialog, keyboard focus and no horizontal overflow. Test waitlist success and failure with an approved test address, and confirm legacy Shopify checkout links. No signup was submitted during this change.

## Release boundary
No deployment, merge, Hostinger operation, live-branch update or Sites registration was performed. `main` and `site` are unchanged. Repository instructions say `site` deploys to Hostinger, but that branch currently lacks `velq-site.php` and uses different routing from `main`. The live public homepage resembles the PHP-bundle design. The review must resolve that deployment-source discrepancy before any release; this PR does not assume that merging main publishes the redesign.

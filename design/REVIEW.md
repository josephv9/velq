# Velq bright premium staging review

Branch: `staging/velq-bright-premium`, based on `main` commit `d81869f0d57a4d745d6753401375d32cf9504ea3`. Hostinger's supplied deployment screen confirms `main` deploys to `public_html` with auto-deployment enabled.

## Design and content
Warm white surfaces, lemon accents, strawberry-red actions, a product card that retains full supplied artwork, responsive layouts, and larger touch targets. Homepage copy, live nutrition strip, Journal cards, comparison link section, menu links, FAQ, waitlist and privacy copy now match the current live structure. The `/compare` hub and all five snack guides restored from the existing approved Hostinger guide package.

## Preservation
All existing PHP-bundle routes except the intentionally reconciled homepage, stylesheet, and sitemap remain byte-identical, including all 11 articles, categories, calculator, images, app, journal, analytics and waitlist assets. Shopify CSP, waitlist API proxy, analytics config endpoint, and form logic remain unchanged. `.htaccess` preserves the existing source policy and explicitly keeps the retired lemonade product URL at HTTP 410.

## Validation
- `python scripts/check-bright-premium.py`: 28 prior routes/assets preserved; reconciled live links/routes/canonicals/schema/sitemap checked.
- `node scripts/check-bundles.js`: all four legacy bundle JSON blocks pass.
- `git diff --check`: passes.
- Existing PHP and HTML routes were verified against the route table. The live website's homepage, all eleven article pages, canonical tags, sitemap, images, FAQ and privacy dialog were checked before reconciliation.

The live-site browser has not yet received the merged release. Full waitlist/checkout submission was not performed. The live homepage reported no layout overflow at 1363px in the inspection browser; small-device visual checks remain limited to the responsive CSS rules until after deployment.

## Release
Merging this reviewed PR into `main` will trigger Hostinger's confirmed auto-deployment to `public_html`. Confirm the live homepage, comparison and guide routes, analytics, waitlist, retired product 410, canonical tags, sitemap and mobile layout after the deployment completes.

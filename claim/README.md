# Velq — bag QR 10% offer (staged, NOT live)

Customer scans the printable QR to https://velqnutrition.com/claim, enters an email and explicitly opts into marketing, and is eligible to claim the reward **once per email**. Existing Velq waitlist emails remain eligible if they have not claimed this separate reward. No additional subscription, new code, or duplicate email occurs after the first successful claim.

## Already created in the connected accounts

- Klaviyo list: `WyrNyv` — **Velq | QR 10% Claim** (single opt-in).
- Klaviyo branded email template: `YdnVvg` — **VELQ | QR 10% code delivery | DRAFT**.
- Klaviyo flow: `SvAfAf` — **Velq | QR 10% — One-time code email | DRAFT**, triggered by joining that list. A cloned template `W6s2Bd` is linked to the flow.
- The printed QR target: `https://velqnutrition.com/claim`.
- No Shopify discounts have yet been created and neither the email flow nor the site endpoint has been activated.

## How the handler works

`claim-api.php` enforces same-origin JSON POST, an explicit email consent checkbox, validation, a hidden spam field and a per-IP rate limit. A local SQLite database outside the webroot records a keyed SHA-256 HMAC of normalized email, not a plaintext email. The unique claim row is reserved under SQLite `BEGIN IMMEDIATE` so simultaneous submissions cannot create duplicates.

The server derives a unique, stable Shopify code from the email plus a private HMAC secret and verifies/creates a 10% code with a **single redemption**, **one use per Shopify customer**, **no stacking**, and **first subscription cycle only**. A Shopify retry checks for an existing code first instead of generating a different code. Then the server updates the Klaviyo profile's `velq_qr_discount_code` property **before** requesting email marketing subscription to the QR list. That list triggers the dedicated Klaviyo welcome email. A second successful claim returns `already` and doesn't create or send anything.

If a provider call is ambiguous after the email-enqueue step begins, the claim is put into `sending` and must be manually reconciled. This deliberately avoids a retry that could trigger duplicate emails. Each provider call is server-side; API keys are never placed in HTML or JS.

No system based only on normalized email can prevent somebody from claiming with a completely different address. Unique single-redemption Shopify codes limit the financial impact, but cannot guarantee identity.

## Required secure Hostinger configuration

1. Deploy the change from the approved feature branch to the Hostinger **site** branch / the files actually served by the website. Keep the main site's packed PHP bundle untouched. Deploy `claim/`, `claim-api.php`, and the scoped `.htaccess` rewrite rules. Confirm `/claim` renders, `/api/claim` rejects GET, and the existing `/api/waitlist` remains unchanged.
2. Enable PHP 8.1+, the cURL and `pdo_sqlite` extensions. Create a **writable folder outside `public_html`**; the SQLite file will be created in it. Never put the database inside `public_html`.
3. Put a secure `velq-qr-private.php` file in the **parent directory** of the site's public webroot. Do not commit or upload this file through GitHub. Use this example as a template:
   ```php
   <?php
   return [
     'VELQ_QR_ENABLED' => '0',
     'VELQ_QR_SHOPIFY_DOMAIN' => 'qusbk4-9s.myshopify.com',
     'VELQ_QR_SHOPIFY_TOKEN' => 'ADD_SECRET_WITH_write_discounts',
     'VELQ_QR_KLAVIYO_TOKEN' => 'ADD_PRIVATE_KEY_WITH_profiles_lists_subscriptions_write',
     'VELQ_QR_HASH_SECRET' => 'GENERATE_ONCE_AND_KEEP_PRIVATE_64_HEX_CHARS',
     'VELQ_QR_DB_PATH' => '/absolute/path/outside/public_html/velq-qr-claims.sqlite',
   ];
   ```
   Generate the secret **once**, save it permanently and do not rotate it after the first claim. A command on your own server: `php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"`. Environment variables with the same names can also be used instead of the private file.
4. In Shopify, use a private Admin token with `read_discounts` and `write_discounts` for the store that receives checkout orders. This does not create a publicly accessible discount code. Do not paste credentials in chat or into GitHub.
5. In Klaviyo, configure a private API key with `profiles:write`, `lists:write` and `subscriptions:write`. Confirm the sending domain **hello.velqnutrition.com** is verified in DNS. When last checked it was **pending/unverified**. The dedicated flow `SvAfAf` is **draft**, so no discount email will be delivered until its email action and flow are set live. Verify the flow's linked clone of the email template displays `{{ person|lookup:'velq_qr_discount_code' }}` instead of a placeholder.
6. Before changing `VELQ_QR_ENABLED` from `0` to `1`, send a real internal test to a controlled inbox and verify the Shopify coupon, actual checkout behavior, email delivery, duplicate claims, and no subscription stacking. Ensure the store is ready to honor the stated offer. **Do not print the bag QR until the page and offer pass all live tests.**

## Manual tests before activation

- New email + consent: exactly one Shopify discount created and one Klaviyo QR flow message queued, 10% applies at checkout one time.
- Repeat the same email (including mixed capitalization and spaces): `already`, no new code, no second welcome email. Try from two browsers and two devices.
- Email already in the **existing Waitlist** list, but not QR list: one new QR claim succeeds.
- Submit identical requests concurrently: at most one new code/email.
- Missing consent, malformed email, unexpected origin, invalid content type, and spam field: no claim.
- Test unverified Klaviyo sender, missing Shopify token, network failures and missing SQLite: the endpoint must fail closed and never falsely promise a reward.
- Confirm first subscription order receives only the first-cycle discount, if subscriptions are offered, and no order discount stacking.
- Confirm no email or code is sent in GA4 or URL parameters. The page emits only the anonymous `qr_offer_view`, `qr_offer_submit`, `qr_offer_claimed`, and `qr_offer_already_claimed` events.

## Risk and operational note

The bulk subscribe endpoint can reverse a previous unsubscribe or suppression when a user explicitly opts in again. This form requires separate, affirmative email marketing consent, but you should still monitor complaints and respect suppression laws. The database stores a hash and the coupon code; Klaviyo stores the email and code for message personalization. Treat it as private marketing data and back up the SQLite file securely.

**Keep this work staged until secrets, domain verification, flow activation, and end-to-end checkout testing have been completed.**
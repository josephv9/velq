<?php
declare(strict_types=1);

/** The same honest launch offer on the homepage and product detail page. */
function velq_conversion_waitlist(): string {
    return <<<'HTML'
<section class="waitlist-section velq-conversion-waitlist" id="waitlist" aria-labelledby="waitlist-title">
  <div class="waitlist-copy">
    <p class="eyebrow">FREE TO JOIN · NO PAYMENT TODAY</p>
    <h2 id="waitlist-title">Get the<br><em>launch email.</em></h2>
    <p>We’ll let you know when Velq is ready to order, with the final formula, pack details and price.</p>
    <p class="velq-waitlist-note">An email signup, with no purchase or subscription commitment.</p>
  </div>
  <form id="waitlist-form" class="waitlist-form" aria-describedby="waitlist-expectations">
    <label for="waitlist-email">Email address</label>
    <input id="waitlist-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" maxlength="254" placeholder="you@example.com" required aria-describedby="signup-feedback">
    <input id="waitlist-interest" name="interest" type="hidden" value="strawberry">
    <div class="signup-trap" aria-hidden="true"><label for="company">Leave this field empty</label><input id="company" name="company" type="text" tabindex="-1" autocomplete="off"></div>
    <label class="consent-label"><input id="waitlist-consent" name="consent" type="checkbox" required><span>Email me Velq launch and product updates. I can unsubscribe anytime.</span></label>
    <button class="button button-dark" id="waitlist-submit" type="submit">JOIN THE WAITLIST <span aria-hidden="true">↗</span></button>
    <p id="signup-feedback" class="signup-feedback" role="status" aria-live="polite" aria-atomic="true"></p>
    <p class="signup-privacy" id="waitlist-expectations">Velq is in development. <a href="/privacy/">Privacy details</a></p>
    <div class="velq-waitlist-next" data-waitlist-next hidden><p>You’re all set. Explore what we’re developing while you wait.</p><a href="/products/strawberry-protein-fiber-gummies" data-product-detail-cta="signup-success">See the gummy details <span aria-hidden="true">→</span></a></div>
  </form>
</section>
HTML;
}

function velq_conversion_response(string $body, string $path): string {
    $canonical = rtrim(preg_replace('~/index\.html$~', '', $path) ?? $path, '/') ?: '/';
    if ($path === '/sitemap.xml') {
        $url = 'https://velqnutrition.com/products/strawberry-protein-fiber-gummies';
        if (str_contains($body, '</urlset>') && !str_contains($body, '<loc>' . $url . '</loc>')) {
            $body = str_replace('</urlset>', '<url><loc>' . $url . '</loc></url></urlset>', $body);
        }
        return $body;
    }
    if (stripos($body, '<html') === false) return $body;
    if ($canonical === '/') {
        $body = preg_replace('~<section\b[^>]*id="waitlist"[^>]*>.*?</section>~s', velq_conversion_waitlist(), $body, 1) ?? $body;
        $body = str_replace('class="product-image-button" href="#waitlist" data-waitlist-cta="home" data-interest="strawberry"', 'class="product-image-button" href="/products/strawberry-protein-fiber-gummies" data-product-detail-cta="product-image" aria-label="View Velq strawberry gummy details"', $body);
        $body = str_replace('<p class="product-size">10 individual packs · 6 gummies per pack</p>', '<p class="product-size">Planned box: 10 packets · 6 gummies per packet</p>', $body);
        if (!str_contains($body, 'class="velq-product-details-link"')) {
            $body = str_replace('<div class="product-specs"><span>20g protein</span><span>10g prebiotic fiber</span><span>80mg caffeine</span><span>200mg L-theanine</span></div>', '<div class="product-specs"><span>20g protein</span><span>10g prebiotic fiber</span><span>80mg caffeine</span><span>200mg L-theanine</span></div><p class="velq-product-note">Targets per packet. Final formula and label may change.</p><a class="velq-product-details-link" href="/products/strawberry-protein-fiber-gummies" data-product-detail-cta="product-card">View product details <span aria-hidden="true">→</span></a>', $body);
        }
        $body = str_replace('enjoy strawberry flavor without mixing.', 'enjoy strawberry flavor.', $body);
        $body = str_replace('href="#waitlist" data-waitlist-cta="home">JOIN THE WAITLIST</a><button id="menu-toggle"', 'href="#waitlist" data-waitlist-cta="header">JOIN THE WAITLIST</a><button id="menu-toggle"', $body);
        $body = str_replace('id="hero-cta" href="#waitlist" data-waitlist-cta="home"', 'id="hero-cta" href="#waitlist" data-waitlist-cta="hero"', $body);
    }
    $body = str_replace('<!-- VELQ_WAITLIST -->', velq_conversion_waitlist(), $body);

    // One ordered analytics owner and one waitlist/popup implementation on every route.
    // Versions also invalidate old Hostinger browser/CDN copies of the competing scripts.
    $head = '<link rel="stylesheet" href="/velq-lead-capture.css?v=popup-cta-20261020">'
        . '<link rel="stylesheet" href="/assets/velq-conversion.css?v=20261020">'
        . '<script src="/analytics-config.js" defer></script>'
        . '<script src="/velq-analytics.js?v=conversion-20261020" defer></script>'
        . '<script src="/analytics.js?v=conversion-20261020" defer></script>';
    $scripts = '<script src="/velq-waitlist.js?v=conversion-20261020" defer></script>'
        . '<script src="/app.js?v=popup-cta-20261020" defer></script>'
        . '<script src="/velq-lead-capture.js?v=popup-copy-20261020b" defer></script>';
    // Preserve current blocks in place when this filter is applied again, so
    // later image/preload metadata stays in its original order. Remove any
    // additional old or duplicated asset tags around the preserved blocks.
    $headMarker = '<!-- VELQ_CONVERSION_HEAD -->';
    $scriptsMarker = '<!-- VELQ_CONVERSION_SCRIPTS -->';
    $headPosition = strpos($body, $head);
    if ($headPosition !== false) $body = substr_replace($body, $headMarker, $headPosition, strlen($head));
    $scriptsPosition = strpos($body, $scripts);
    if ($scriptsPosition !== false) $body = substr_replace($body, $scriptsMarker, $scriptsPosition, strlen($scripts));
    $scriptPattern = '~<script\b[^>]*src=["\']/((?:analytics-config|velq-analytics|analytics|app|velq-waitlist|velq-lead-capture)\.js)(?:\?[^"\']*)?["\'][^>]*>\s*</script>~i';
    $body = preg_replace($scriptPattern, '', $body) ?? $body;
    $body = preg_replace('~<link\b[^>]*href=["\']/velq-lead-capture\.css(?:\?[^"\']*)?["\'][^>]*>~i', '', $body) ?? $body;
    $body = preg_replace('~<link\b[^>]*href=["\']/assets/velq-conversion\.css(?:\?[^"\']*)?["\'][^>]*>~i', '', $body) ?? $body;
    $body = $headPosition !== false ? str_replace($headMarker, $head, $body)
        : str_ireplace('</head>', $head . '</head>', $body);
    return $scriptsPosition !== false ? str_replace($scriptsMarker, $scripts, $body)
        : str_ireplace('</body>', $scripts . '</body>', $body);
}

<?php
declare(strict_types=1);

/** Approved lifestyle cover, applied only to the existing homepage. */
function velq_home_cover(string $html, string $path): string {
    if ($path === '/') $html = velq_compact_product_section($html);
    // Remove only the homepage Journal preview; keep the Journal and articles available.
    if ($path === '/') {
        // Approved white pouch and packet with strawberries, homepage product card only.
        $html = preg_replace_callback(
            '~(<div class="product-visual[^"]*"[^>]*>.*?<img)\\b[^>]*>~s',
            static fn(array $m): string => $m[1].' src="/assets/velq-white-strawberry-product-20261031.webp" alt="White Velq strawberry protein and fiber gummies bag and individual packet surrounded by strawberries and red gummies" width="1254" height="1254" loading="lazy" decoding="async">',
            $html, 1
        ) ?? $html;
        // Remove the three-step "Keep moving. Keep it simple." homepage section.
        $html = preg_replace('~<section\\b[^>]*class="ritual section"[^>]*>.*?</section>~s', '', $html, 1) ?? $html;
        $html = preg_replace('~<section\\b[^>]*aria-labelledby="journal-title"[^>]*>.*?</section>~s', '', $html, 1) ?? $html;
    }
    if (strpos($html, 'class="hero lifestyle-cover') !== false) return $html;
    if ($path !== '/' || strpos($html, 'aria-labelledby="hero-title"') === false) return $html;
    $html = preg_replace('~<header class="header">.*?</header>~s',
        '<header class="header"><button id="menu-toggle" class="icon-button menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button><a href="/" class="wordmark" aria-label="Velq home"><img class="velq-rounded-logo" src="/assets/velq-rounded-wordmark-black.png?v=20261020" alt="Velq" width="1652" height="799"></a><a class="button nav-signup" href="#waitlist" data-waitlist-cta="header">Join waitlist</a></header>', $html, 1) ?? $html;
    $artwork = '/assets/velq-gummy-bears-cover-20261031.webp';
    $hero = '<section class="hero lifestyle-cover velq-approved-cover" aria-labelledby="hero-title">'
        . '<img class="approved-cover-art" src="'.$artwork.'" width="852" height="1847" alt="Smiling woman in blue holding Velq strawberry protein and fiber gummies" fetchpriority="high" decoding="async">'
        . '<div class="cover-shipping" role="note" aria-label="Free shipping on orders over $50"><div class="cover-shipping-track" aria-hidden="true"><span>FREE SHIPPING ON ORDERS OVER $50 &nbsp; • &nbsp; PRE-ORDER &nbsp; • &nbsp;</span><span>FREE SHIPPING ON ORDERS OVER $50 &nbsp; • &nbsp; PRE-ORDER &nbsp; • &nbsp;</span></div></div>'
        . '<div class="cover-accessible-copy"><p>Strawberry · Coming soon</p><h1 id="hero-title">Protein + Fiber Gummies</h1><p>Protein, fiber, caffeine, and L-theanine in one gummy.</p></div>'
        . '<button class="cover-menu" id="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav"></button>'
        . '<a class="cover-home" href="/" aria-label="Velq home"></a>'
        . '<a class="cover-bag" href="#waitlist" data-waitlist-cta="header" aria-label="Get early access"></a>'
        . '<a class="cover-waitlist" id="hero-cta" href="#waitlist" data-waitlist-cta="hero" aria-label="Join the free waitlist"></a>'
        . '</section>'
        . '<div class="velq-benefit-marquee" role="region" aria-label="20g Protein, 10g Fiber, 80mg Caffeine, 200mg L-Theanine, Zero Sugar, Grab and Go" tabindex="0"><div class="velq-benefit-marquee-track" aria-hidden="true"><span>20g Protein • 10g Fiber • 80mg Caffeine • 200mg L-Theanine • Zero Sugar • Grab &amp; Go &nbsp; • &nbsp; </span><span>20g Protein • 10g Fiber • 80mg Caffeine • 200mg L-Theanine • Zero Sugar • Grab &amp; Go &nbsp; • &nbsp; </span></div></div>';
    // Navigation is overlaid on the approved artwork instead of a white floating panel.
    $html = preg_replace('~<header class="header">.*?</header>~s', '', $html, 1) ?? $html;
    $html = preg_replace('~<section class="hero"[^>]*>.*?</section>~s', $hero, $html, 1) ?? $html;
    $html = velq_single_product_layout($html);
    $html = str_replace('<body>', '<body class="velq-cover-home">', $html);
    $html = preg_replace('~<link\b[^>]*data-velq-responsive-preload[^>]*>~i', '', $html) ?? $html;
    $preload = '<link data-velq-responsive-preload rel="preload" as="image" href="'.$artwork.'" fetchpriority="high">';
    return str_replace('</head>', '<link rel="stylesheet" href="/assets/velq-home-cover.css?v=20261031-compact-layout-4">'.$preload.'</head>', $html);
}

/** Single-product layout. Image slots accept ordinary img elements when supplied. */
function velq_single_product_layout(string $html): string {
    if (strpos($html, 'id="why-velq"') !== false) return $html;
    $waitlist = '';
    $html = preg_replace_callback('~<section class="waitlist-section[^>]*>.*?</section>~s', static function(array $m) use (&$waitlist): string { $waitlist=$m[0]; return ''; }, $html, 1) ?? $html;
    $html = str_replace('<h2 id="products-title">One pack.<br><em>Built for your day.</em></h2>', '<h2 id="products-title">Meet your <strong>daily upgrade.</strong></h2>', $html);
    $html = str_replace('<h2 id="waitlist-title">Get the<br><em>launch email.</em></h2>', '<h2 id="waitlist-title">Join the <strong>Velq Club.</strong></h2>', $html);
    $waitlist = str_replace('<h2 id="waitlist-title">Get the<br><em>launch email.</em></h2>', '<h2 id="waitlist-title">Join the <strong>Velq Club.</strong></h2>', $waitlist);
    $why = <<<'HTML'
<section class="cadence-section" id="why-velq" aria-labelledby="why-title">
  <h2 id="why-title">Why <strong>Velq?</strong></h2>
  <div class="benefit-track" tabindex="0" aria-label="Velq formula highlights, swipe to explore">
    <article class="benefit-card benefit-uniform-card"><div class="benefit-uniform-copy"><h3>Built for your everyday.</h3><p>Protein, fiber and caffeine.<br>One easy gummy routine.</p></div><div class="benefit-uniform-photo"><svg viewBox="0 0 627 376" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Man in a white T-shirt holding a small white Velq strawberry gummy packet at the gym"><image href="/assets/velq-why-everyday-white-packet-20261031.webp" width="627" height="376" preserveAspectRatio="none"/></svg></div></article>
    <article class="benefit-card benefit-uniform-card"><div class="benefit-uniform-copy"><h3>Big on the essentials.</h3><p>20g protein. 10g fiber. 80mg caffeine.<br>All in your daily pack.</p></div><div class="benefit-uniform-photo"><svg viewBox="58 486 1154 656" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Red strawberry gummy bears"><image href="/assets/velq-why-essentials-20261020-1200.webp" width="1270" height="1239" preserveAspectRatio="none"/></svg></div></article>
    <article class="benefit-card benefit-uniform-card"><div class="benefit-uniform-copy"><h3>Ready when you are.</h3><p>Strawberry gummies that fit<br>wherever your day takes you.</p></div><div class="benefit-uniform-photo"><img src="https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-ready-when-you-are-tan-white-packet.jpg?v=1793481790" alt="Woman in a tan jacket holding a small white Velq strawberry gummies packet outdoors" width="716" height="424" loading="lazy" decoding="async" style="display:block;width:100%;height:100%;object-fit:cover;"></div></article>
  </div>
  
</section>
<section class="velq-image-carousel cadence-section" id="ingredients" aria-label="Discover Velq gummies">
<div class="velq-image-track" tabindex="0" role="region" aria-label="Swipe or use arrow keys to explore three Velq images">
<figure class="velq-image-slide" id="velq-discover-1" aria-label="1 of 3"><img src="/assets/velq-discover-nutrition-20261031-800.webp" srcset="/assets/velq-discover-nutrition-20261031-480.webp 480w, /assets/velq-discover-nutrition-20261031-800.webp 800w" sizes="(max-width: 620px) 88vw, 420px" width="706" height="1536" alt="More in every bite. Per packet: 20g protein, 10g prebiotic fiber, 80mg caffeine and 200mg L-theanine." loading="lazy" decoding="async"></figure>
<figure class="velq-image-slide" id="velq-discover-2" aria-label="2 of 3"><img src="/assets/velq-discover-flavor-20261031-800.webp" srcset="/assets/velq-discover-flavor-20261031-480.webp 480w, /assets/velq-discover-flavor-20261031-800.webp 800w" sizes="(max-width: 620px) 88vw, 420px" width="706" height="1536" alt="Zero sugar. Big strawberry flavor. Strawberry gummies with 0g sugar per packet." loading="lazy" decoding="async"></figure>
<figure class="velq-image-slide" id="velq-discover-3" aria-label="3 of 3"><img src="/assets/velq-discover-routine-20261031-800.webp" srcset="/assets/velq-discover-routine-20261031-480.webp 480w, /assets/velq-discover-routine-20261031-800.webp 800w" sizes="(max-width: 620px) 88vw, 420px" width="706" height="1536" alt="Your day. Take Velq with you. Portable packets for your gym bag, workday and on the go." loading="lazy" decoding="async"></figure>
</div><nav class="velq-carousel-nav" aria-label="Choose a Velq slide"><a href="#velq-discover-1" aria-label="Slide 1: Nutrition">1</a><a href="#velq-discover-2" aria-label="Slide 2: Strawberry flavor">2</a><a href="#velq-discover-3" aria-label="Slide 3: Everyday convenience">3</a><span>Swipe to explore →</span></nav></section>
HTML;
    $html = preg_replace('~<section class="ingredient-section".*?</section>~s', $why, $html, 1) ?? $html;
    $html = preg_replace('~<section class="closing">.*?</section>~s', '', $html, 1) ?? $html;
    $footer = $waitlist.'<footer class="velq-club-footer"><div class="club-links"><nav aria-label="Meet Velq"><h3>Meet Velq</h3><a href="#products">Strawberry gummies</a><a href="#ingredients">What’s inside</a><a href="#story">Our story</a><a href="#faq">FAQs</a></nav><nav aria-label="Resources"><h3>Resources</h3><a href="/blog">The Velq Journal</a><a href="/guides/protein-and-fiber-snacks">Snack guides</a><a href="/tools/nutrition-label-value-calculator">Compare nutrition labels</a><a href="/research">Research</a><a href="/media">Media &amp; resources</a></nav><nav aria-label="Client services"><h3>Client Services</h3><a href="/contact/">Contact</a><a href="/shipping/">Shipping</a><a href="/privacy/">Privacy policy</a><a href="/terms/">Terms &amp; conditions</a></nav></div><a class="club-wordmark" href="/" aria-label="Velq home"><img class="velq-rounded-logo" src="/assets/velq-rounded-wordmark-black.png?v=20261020" alt="Velq" width="1652" height="799"></a><div class="club-bottom"><span>UNITED STATES · USD $</span><span>© 2026 Velq Nutrition LLC</span></div><p class="club-development">Product in development. Final packaging, price and nutrition details may change.</p></footer><a class="back-top" href="#main" aria-label="Back to top">↑</a>';
    $html = preg_replace_callback('~<footer>.*?</footer>~s', static fn(array $m): string => $footer, $html, 1) ?? $html;
    // Remove the homepage founder panel and navigation to the removed section.
    $html = preg_replace('~<section\\b[^>]*\\bid="story"[^>]*>.*?</section>~s', '', $html, 1) ?? $html;
    $html = preg_replace('~<a\\b[^>]*href="#story"[^>]*>.*?</a>~s', '', $html) ?? $html;
    // Remove the homepage guide-promotion section requested by the owner.
    $html = preg_replace('~<section\b[^>]*aria-labelledby="compare-heading"[^>]*>.*?</section>~s', '', $html, 1) ?? $html;
    $html = preg_replace('~<nav\b[^>]*aria-label="Product buying guides"[^>]*>.*?</nav>~s', '', $html, 1) ?? $html;
    return $html;
}

/** Approved compact product section; nutrition remains in the strip above. */
function velq_compact_product_section(string $html): string {
    $section = <<<'HTML'
<section class="products section velq-compact-product" id="products" aria-labelledby="products-title">
  <h2 id="products-title">Meet your daily<br>upgrade.</h2>
  <a class="velq-compact-image" href="/products/strawberry-protein-fiber-gummies" data-product-detail-cta="product-image" aria-label="View Velq strawberry gummy details"><img src="/assets/velq-white-strawberry-product-20261031.webp" alt="Velq strawberry gummy pouch and individual packet with strawberries" width="1254" height="1254" loading="lazy" decoding="async"></a>
  <p class="velq-compact-flavor">Strawberry · Zero sugar</p>
  <p class="velq-compact-size">10 packets per box</p>
  <a class="velq-compact-cta" href="#waitlist" data-waitlist-cta="home" data-interest="strawberry">Get Early Access</a>
  <a class="velq-compact-details" href="/products/strawberry-protein-fiber-gummies" data-product-detail-cta="product-card">Product details <span aria-hidden="true">↓</span></a>
</section>

HTML;
    return preg_replace('~<section\b[^>]*\bid="products"[^>]*>.*?</section>~s', $section, $html, 1) ?? $html;
}


<?php
declare(strict_types=1);

/** Approved lifestyle cover, applied only to the existing homepage. */
function velq_home_cover(string $html, string $path): string {
    $html = str_replace('<p class="club-development">Product in development. Final packaging, price and nutrition details may change.</p>', '', $html);
    // Remove duplicate white nutrition grid and serving-label caption below the marquee.
    if ($path === '/') {
        $html = preg_replace('~<div\\b[^>]*class="nutrition-strip"[^>]*>.*?</div>~s', '', $html, 1) ?? $html;
    }

    if ($path === '/') $html = velq_compact_product_section($html);
    // Approved white pouch creative, scoped to the homepage product card.
    if ($path === '/') {
        // Approved white pouch and packet with strawberries, homepage product card only.
        $html = preg_replace_callback(
            '~(<div class="product-visual[^"]*"[^>]*>.*?<img)\\b[^>]*>~s',
            static fn(array $m): string => $m[1].' src="https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-splash-product-20261031.jpg?v=1793484541" alt="Velq white strawberry protein and fiber gummies pouch and single packet surrounded by floating strawberries and red gummies" width="1254" height="1254" loading="lazy" decoding="async">',
            $html, 1
        ) ?? $html;
        $html = preg_replace_callback('~(<div class="product-visual strawberry">.*?)(<img\\b[^>]*>)~s', static function(array $m): string {
            $image = '<img src="/assets/velq-strawberry-white-product-20261031-800.webp" srcset="/assets/velq-strawberry-white-product-20261031-480.webp 480w, /assets/velq-strawberry-white-product-20261031-800.webp 800w, /assets/velq-strawberry-white-product-20261031-1200.webp 1200w" sizes="(max-width: 650px) 90vw, (max-width: 1100px) 48vw, 560px" width="1254" height="1254" loading="lazy" decoding="async" alt="Velq white strawberry gummies pouch and individual packet surrounded by strawberries and red gummy bears">';
            return $m[1] . $image;
        }, $html, 1) ?? $html;
    }
    // Remove only the homepage Journal preview; keep the Journal and articles available.
    if ($path === '/') {
        // Remove the three-step "Keep moving. Keep it simple." homepage section.
        $html = preg_replace('~<section\\b[^>]*class="ritual section"[^>]*>.*?</section>~s', '', $html, 1) ?? $html;
        $html = preg_replace('~<section\\b[^>]*aria-labelledby="journal-title"[^>]*>.*?</section>~s', '', $html, 1) ?? $html;
    }
    if (strpos($html, 'class="hero lifestyle-cover') !== false) return $html;
    if ($path !== '/' || strpos($html, 'aria-labelledby="hero-title"') === false) return $html;
    $html = preg_replace('~<header class="header">.*?</header>~s',
        '<header class="header"><button id="menu-toggle" class="icon-button menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button><a href="/" class="wordmark" aria-label="Velq home"><img class="velq-rounded-logo" src="/assets/velq-rounded-wordmark-black.png?v=20261020" alt="Velq" width="1652" height="799"></a><a class="button nav-signup" href="#waitlist" data-waitlist-cta="header">Join waitlist</a></header>', $html, 1) ?? $html;
    $artwork = 'https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-home-cover-strawberry-20261103.jpg?v=1793766288';
    $hero = '<section class="hero lifestyle-cover velq-approved-cover" aria-labelledby="hero-title">'
        . '<div class="cover-photo">'
        . '<div class="cover-shipping" role="note" aria-label="Velq strawberry gummies coming soon"><div class="cover-shipping-track" aria-hidden="true"><span>STRAWBERRY GUMMIES COMING SOON &nbsp; • &nbsp; STRAWBERRY GUMMIES COMING SOON &nbsp; • &nbsp; </span><span>STRAWBERRY GUMMIES COMING SOON &nbsp; • &nbsp; STRAWBERRY GUMMIES COMING SOON &nbsp; • &nbsp; </span></div></div>'
        . '<nav class="cover-navigation" aria-label="Main navigation">'
        . '<button class="cover-menu" id="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>'
        . '<a class="cover-home" href="/" aria-label="Velq home"></a>'
        . '<a class="cover-bag" href="#waitlist" data-waitlist-cta="header" aria-label="Get early access"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14l2 14H3L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg></a>'
        . '</nav>'
        . '<div class="cover-image-window"><img class="approved-cover-art" src="'.$artwork.'" width="1122" height="1402" alt="Smiling woman holding a white Velq strawberry protein, fiber and energy gummies pouch" fetchpriority="high" decoding="async"></div>'
        . '</div>'
        . '<div class="cover-conversion" id="waitlist">'
        . '<p class="cover-kicker">STRAWBERRY · COMING SOON</p>'
        . '<h1 id="hero-title">Strawberry Protein + Fiber &amp; Energy Gummies</h1>'
        . '<p class="cover-tagline">Your daily nutrition. In one little packet.</p>'
        . '<p class="cover-benefit">20g protein + 10g prebiotic fiber + 80mg caffeine + 200mg L-theanine per packet.</p>'
        . '<div class="cover-form-container"><!--VELQ_HERO_FORM--></div>'
        . '<p class="cover-no-payment">Free to join · No payment today · Unsubscribe anytime</p>'
        . '</div>'
        . '</section>'
        . '<div class="velq-benefit-marquee" role="region" aria-label="20g Protein, 10g Fiber, 80mg Caffeine, 200mg L-Theanine, Zero Sugar, Grab and Go" tabindex="0"><div class="velq-benefit-marquee-track" aria-hidden="true"><span>20g Protein • 10g Fiber • 80mg Caffeine • 200mg L-Theanine • Zero Sugar • Grab &amp; Go &nbsp; • &nbsp; </span><span>20g Protein • 10g Fiber • 80mg Caffeine • 200mg L-Theanine • Zero Sugar • Grab &amp; Go &nbsp; • &nbsp; </span></div></div>';
    // Navigation is overlaid on the approved artwork instead of a white floating panel.
    $html = preg_replace('~<header class="header">.*?</header>~s', '', $html, 1) ?? $html;
    $html = preg_replace('~<section class="hero"[^>]*>.*?</section>~s', $hero, $html, 1) ?? $html;
    $html = velq_single_product_layout($html);
    // Reuse the existing consent-aware waitlist form in the hero.
    // Move, rather than duplicate, the form to keep one ID and one backend journey.
    $heroForm = '';
    $html = preg_replace_callback(
        '~<form\b(?=[^>]*\bid="waitlist-form")[^>]*>.*?</form>~si',
        static function (array $m) use (&$heroForm): string { $heroForm = $m[0]; return ''; },
        $html,
        1
    ) ?? $html;
    if ($heroForm !== '') {
        $heroForm = str_replace('>GET LAUNCH UPDATES', '>GET EARLY ACCESS', $heroForm);
        $html = preg_replace('~<section\b(?=[^>]*\bid="waitlist")[^>]*>.*?</section>~si', '', $html, 1) ?? $html;
        $html = str_replace('<!--VELQ_HERO_FORM-->', $heroForm, $html);
    } else {
        // Progressive fallback if the bundled form markup changes.
        $html = str_replace('class="cover-conversion" id="waitlist"', 'class="cover-conversion" id="hero-signup"', $html);
        $html = str_replace('<!--VELQ_HERO_FORM-->', '<a class="cover-fallback-cta" href="#waitlist">Get Early Access</a>', $html);
    }
    $html = str_replace('<body>', '<body class="velq-cover-home">', $html);
    $html = preg_replace('~<link\b[^>]*data-velq-responsive-preload[^>]*>~i', '', $html) ?? $html;
    $preload = '<link data-velq-responsive-preload rel="preload" as="image" href="'.$artwork.'" fetchpriority="high">';
    return str_replace('</head>', '<link rel="stylesheet" href="/assets/velq-home-cover.css?v=20261106-product-details">'.$preload.'<link rel="stylesheet" href="/assets/velq-cover-layout-20261031.css?v=layout-1"></head>', $html);
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
    <article class="benefit-card benefit-uniform-card"><div class="benefit-uniform-copy"><h3>Built for your everyday.</h3><p>Protein, fiber and caffeine.<br>One easy gummy routine.</p></div><div class="benefit-uniform-photo"><img src="/assets/velq-gym-small-packet-20261104.webp" alt="Man in a white T-shirt holding a small Velq strawberry gummy packet at the gym" width="1536" height="1024" loading="lazy" decoding="async" style="display:block;width:100%;height:100%;object-fit:cover;"></div></article>
    <article class="benefit-card benefit-uniform-card"><div class="benefit-uniform-copy"><h3>Big on the essentials.</h3><p>20g protein. 10g fiber. 80mg caffeine.<br>All in your daily pack.</p></div><div class="benefit-uniform-photo"><svg viewBox="58 486 1154 656" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Red strawberry gummy bears"><image href="/assets/velq-why-essentials-20261020-1200.webp" width="1270" height="1239" preserveAspectRatio="none"/></svg></div></article>
    <article class="benefit-card benefit-uniform-card"><div class="benefit-uniform-copy"><h3>Ready when you are.</h3><p>Strawberry gummies that fit<br>wherever your day takes you.</p></div><div class="benefit-uniform-photo"><svg viewBox="69 256 1311 780" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Woman in a tan jacket holding a small Velq strawberry gummies packet outdoors"><image href="/assets/velq-park-small-packet-20261104.webp" width="1448" height="1086"/></svg></div></article>
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
    $footer = $waitlist . <<<'HTML'
<footer class="velq-club-footer velq-black-footer" data-footer-version="black-20261031">
<section class="black-footer-signup"><h2>SIGN UP TO GET 10% OFF YOUR FIRST ORDER</h2>
<form id="velq-footer-email-form"><label for="velq-footer-email" class="footer-visually-hidden">Email address</label><div class="black-footer-field"><input id="velq-footer-email" type="email" autocomplete="email" placeholder="EMAIL ADDRESS" required><button type="submit" aria-label="Continue to early access signup">→</button></div></form>
<p>Launches, restocks, and where to find us in store.</p></section>
<div class="black-footer-columns"><nav aria-label="Information"><h3>INFO</h3><a href="/our-story/">OUR STORY</a><a href="/wholesale/">WHOLESALE</a><a href="/contact/">CONTACT</a><a href="/blog">OUR JOURNAL</a><a href="#faq">FAQ</a></nav><nav aria-label="Shop"><h3>SHOP</h3><a href="#products">SHOP ALL</a><a href="/products/strawberry-protein-fiber-gummies">STRAWBERRY</a><a href="#waitlist" data-waitlist-cta="footer">GET EARLY ACCESS</a></nav></div>
<section class="black-footer-social"><h3>SOCIAL</h3><div><a href="https://www.instagram.com/velqnutrition/" aria-label="Velq on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7"/></svg></a><a href="https://www.tiktok.com/@velqclub" aria-label="Velq on TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v12a4 4 0 1 1-4-4M14 3c0 4 3 6 6 6"/></svg></a></div></section>
<nav class="black-footer-policies" aria-label="Policies"><a href="/privacy/">PRIVACY POLICY</a><a href="/terms/">TERMS OF SERVICE</a><a href="/shipping/">SHIPPING POLICY</a><a href="/shipping/#refunds">REFUND POLICY</a></nav>
<a class="club-wordmark" href="/" aria-label="Velq home"><img class="velq-bag-logo" src="/assets/velq-bag-wordmark-20261031.svg" alt="Velq" width="455" height="230"></a>
<div class="black-footer-copyright">© 2026 Velq Nutrition LLC</div></footer><a class="back-top" href="#main" aria-label="Back to top">↑</a>
HTML;

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
  <a class="velq-compact-image" href="/products/strawberry-protein-fiber-gummies" data-product-detail-cta="product-image" aria-label="View Velq strawberry gummy details"><img src="https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-gummies-homepage-white-20261106.jpg?v=1793991829" alt="Velq strawberry protein, fiber and energy gummies pouch and packet with strawberries and red gummy bears on a bright white background" width="1254" height="1254" loading="lazy" decoding="async"></a>
  <p class="velq-compact-flavor">Strawberry · Zero sugar</p>
  <p class="velq-compact-size">10 packets per box</p>
  <a class="velq-compact-cta" href="#waitlist" data-waitlist-cta="home" data-interest="strawberry">NOTIFY ME AT LAUNCH</a>
  <a class="velq-compact-details" href="/products/strawberry-protein-fiber-gummies" data-product-detail-cta="product-card">Product details <span aria-hidden="true">↓</span></a>
</section>

HTML;
    return preg_replace('~<section\b[^>]*\bid="products"[^>]*>.*?</section>~s', $section, $html, 1) ?? $html;
}

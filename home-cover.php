<?php
declare(strict_types=1);

/** Approved lifestyle cover, applied only to the existing homepage. */
function velq_home_cover(string $html, string $path): string {
    if (strpos($html, 'class="hero lifestyle-cover"') !== false) return $html;
    if ($path !== '/' || strpos($html, 'aria-labelledby="hero-title"') === false) return $html;
    $html = preg_replace('~<header class="header">.*?</header>~s',
        '<header class="header"><button id="menu-toggle" class="icon-button menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button><a href="/" class="wordmark" aria-label="Velq home">velq</a><a class="button nav-signup" href="#waitlist" data-waitlist-cta="header">Join waitlist</a></header>', $html, 1) ?? $html;
    $base = '/assets/velq-lifestyle-cover-20261020';
    $image = '<img id="hero-image" src="'.$base.'-800.webp" srcset="'.$base.'-480.webp 480w, '.$base.'-800.webp 800w, '.$base.'-1200.webp 1200w" sizes="100vw" width="1122" height="1402" alt="Woman holding a red and white Velq strawberry protein and fiber gummy packet by the coast" fetchpriority="high" decoding="async">';
    $hero = '<section class="hero lifestyle-cover" aria-labelledby="hero-title">'
        . '<div class="hero-image-wrap">'.$image.'</div>'
        . '<div class="hero-copy"><p class="eyebrow" id="hero-eyebrow">PROTEIN + FIBER GUMMIES</p>'
        . '<h1 id="hero-title"><span>Your Daily</span><span><strong>Wellness</strong> Upgrade</span></h1>'
        . '<p class="hero-description" id="hero-description">Protein, fiber and focused energy. In a gummy.</p>'
        . '<a class="button button-dark" id="hero-cta" href="#waitlist" data-waitlist-cta="hero">JOIN THE WAITLIST</a>'
        . '<p class="hero-small" id="hero-small">In development · Target formula; final details may change.</p></div></section>';
    $html = preg_replace('~<section class="hero"[^>]*>.*?</section>~s', $hero, $html, 1) ?? $html;
    $html = velq_single_product_layout($html);
    $html = str_replace('<body>', '<body class="velq-cover-home">', $html);
    $html = preg_replace('~<link\b[^>]*data-velq-responsive-preload[^>]*>~i', '', $html) ?? $html;
    $preload = '<link data-velq-responsive-preload rel="preload" as="image" href="'.$base.'-800.webp" imagesrcset="'.$base.'-480.webp 480w, '.$base.'-800.webp 800w, '.$base.'-1200.webp 1200w" imagesizes="100vw" fetchpriority="high">';
    return str_replace('</head>', '<link rel="stylesheet" href="/assets/velq-home-cover.css?v=20261020-single-5">'.$preload.'</head>', $html);
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
    <article class="benefit-card"><h3>More in your everyday.</h3><p>Protein and prebiotic fiber in one strawberry gummy format, made to fit your routine.</p><div class="benefit-media" data-image-slot="protein-fiber"><span class="metric-art">20g <small>protein</small><br>10g <small>fiber</small></span></div></article>
    <article class="benefit-card"><h3>A little lift. A little focus.</h3><p>Caffeine and L-theanine, together in a measured, portable packet.</p><div class="benefit-media energy-art" data-image-slot="energy-focus"><span class="metric-art">80mg <small>caffeine</small><br>200mg <small>L-theanine</small></span></div></article>
    <article class="benefit-card"><h3>Made to go with you.</h3><p>From your morning commute to your afternoon break. One product, plenty of everyday moments.</p><div class="benefit-media routine-art" data-image-slot="daily-lifestyle"><span class="routine-type">Small pack.<br><strong>Big routine.</strong></span></div></article>
  </div>
  <p class="formula-note">Target amounts per packet. Product in development; final formula and label may change.</p>
</section>
<section class="formula-section cadence-section" id="ingredients" aria-labelledby="ingredient-title">
 <div class="formula-heading"><h2 id="ingredient-title">One gummy format.<br><strong>More inside.</strong></h2><p>Get to know the target formula.</p><a href="/products/strawberry-protein-fiber-gummies">Explore the product →</a></div>
 <div class="formula-accordion">
  <details open><summary><span>01</span> Protein <b>20g</b></summary><p>An easy addition to your daily protein intake. The target formula provides 20g per complete packet.</p><a href="/blog/how-much-protein-do-you-actually-need">Learn about protein →</a></details>
  <details><summary><span>02</span> Prebiotic fiber <b>10g</b></summary><p>More fiber, built into your everyday routine. Target: 10g per packet. Final serving directions and ingredients will appear on the label.</p><a href="/blog/how-much-fiber-do-you-need-every-day">Learn about fiber →</a></details>
  <details><summary><span>03</span> Caffeine <b>80mg</b></summary><p>A measured lift for your day. Velq is being developed for adults and contains caffeine; final usage directions will be on the label.</p><a href="/blog/caffeine-gummies-vs-coffee-whats-the-difference">Explore caffeine →</a></details>
  <details><summary><span>04</span> L-theanine <b>200mg</b></summary><p>A thoughtful addition to the target formula, paired with caffeine. Final nutrition details may change.</p><a href="/blog/caffeine-l-theanine-vs-caffeine">Learn about the pairing →</a></details>
 </div>
</section>
HTML;
    $html = preg_replace('~<section class="ingredient-section".*?</section>~s', $why, $html, 1) ?? $html;
    $html = preg_replace('~<section class="closing">.*?</section>~s', '', $html, 1) ?? $html;
    $footer = '<footer class="velq-club-footer">'.$waitlist.'<div class="club-links"><nav aria-label="Meet Velq"><h3>Meet Velq</h3><a href="#products">Strawberry gummies</a><a href="#ingredients">What’s inside</a><a href="#story">Our story</a><a href="#faq">FAQs</a></nav><nav aria-label="Resources"><h3>Resources</h3><a href="/blog">The Velq Journal</a><a href="/guides/protein-and-fiber-snacks">Snack guides</a><a href="/tools/nutrition-label-value-calculator">Compare nutrition labels</a><a href="/research">Research</a><a href="/media">Media &amp; resources</a></nav><nav aria-label="Client services"><h3>Client Services</h3><a href="/contact/">Contact</a><a href="/shipping/">Shipping</a><a href="/privacy/">Privacy policy</a><a href="/terms/">Terms &amp; conditions</a></nav></div><a class="club-wordmark" href="/" aria-label="Velq home">velq</a><div class="club-bottom"><span>UNITED STATES · USD $</span><span>© 2026 Velq Nutrition LLC</span></div><p class="club-development">Product in development. Final packaging, price and nutrition details may change.</p></footer><a class="back-top" href="#main" aria-label="Back to top">↑</a>';
    $html = preg_replace_callback('~<footer>.*?</footer>~s', static fn(array $m): string => $footer, $html, 1) ?? $html;
    return $html;
}

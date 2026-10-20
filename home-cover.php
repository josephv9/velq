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
    $html = str_replace('<body>', '<body class="velq-cover-home">', $html);
    $html = preg_replace('~<link\b[^>]*data-velq-responsive-preload[^>]*>~i', '', $html) ?? $html;
    $preload = '<link data-velq-responsive-preload rel="preload" as="image" href="'.$base.'-800.webp" imagesrcset="'.$base.'-480.webp 480w, '.$base.'-800.webp 800w, '.$base.'-1200.webp 1200w" imagesizes="100vw" fetchpriority="high">';
    return str_replace('</head>', '<link rel="stylesheet" href="/assets/velq-home-cover.css?v=20261020-4">'.$preload.'</head>', $html);
}

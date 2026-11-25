<?php
declare(strict_types=1);

/** Search-snippet and content-accuracy improvements; no changes to the waitlist API. */
function velq_growth_meta(string $html, string $keyType, string $key, string $value): string
{
    $pattern = '~<meta\b[^>]*\b' . preg_quote($keyType, '~') . '=["\']' . preg_quote($key, '~') . '["\'][^>]*>~i';
    $safe = htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    return preg_replace_callback($pattern, static function (array $match) use ($safe): string {
        $changed = preg_replace('~\bcontent=(["\']).*?\1~is', 'content="' . $safe . '"', $match[0], 1, $count);
        return $count === 1 && is_string($changed) ? $changed : $match[0];
    }, $html, 1) ?? $html;
}

function velq_growth_snippet(string $html, string $title, string $description): string
{
    $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $html = preg_replace('~<title(?:\s[^>]*)?>.*?</title>~is', '<title>' . $safeTitle . '</title>', $html, 1) ?? $html;
    foreach ([['name', 'description', $description], ['property', 'og:title', $title],
              ['property', 'og:description', $description], ['name', 'twitter:title', $title],
              ['name', 'twitter:description', $description]] as [$type, $key, $value]) {
        $html = velq_growth_meta($html, $type, $key, $value);
    }
    return $html;
}


/** Link existing research and buying pages without changing waitlist behavior. */
function velq_growth_related_links(string $html, string $path): string
{
    $heading = '';
    $intro = '';
    $links = [];
    if ($path === '/products/strawberry-protein-fiber-gummies') {
        $heading = 'Compare before you choose';
        $intro = 'Velq is in development and is not yet available to order. Use these free resources to understand gummy serving labels.';
        $links = [
            ['/blog/protein-gummies-with-fiber-comparison', 'Protein gummies with fiber: label comparison'],
            ['/blog/protein-and-fiber-gummies-buying-guide', 'Protein and fiber gummies buying guide'],
            ['/research/gummy-serving-study-2026', 'Original gummy serving-size research'],
        ];
    } elseif ($path === '/blog/protein-and-fiber-gummies-buying-guide') {
        $heading = 'Explore the Velq product and research';
        $intro = 'The product is prelaunch; the research compares current manufacturer labels, not Velq laboratory results.';
        $links = [
            ['/products/strawberry-protein-fiber-gummies', 'See Velq strawberry protein and fiber gummies'],
            ['/blog/protein-gummies-with-fiber-comparison', 'Compare protein gummy label examples'],
            ['/research/gummy-serving-study-2026', 'Inspect sources and download serving data'],
        ];
    }
    if ($links === [] || str_contains($html, 'id="velq-seo-related"')) return $html;
    $escape = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $items = '';
    foreach ($links as [$href, $label]) {
        $items .= '<li><a href="' . $escape($href) . '">' . $escape($label) . '</a></li>';
    }
    $section = '<section class="velq-seo-related" id="velq-seo-related" aria-labelledby="velq-seo-related-heading">'
        . '<h2 id="velq-seo-related-heading">' . $escape($heading) . '</h2>'
        . '<p>' . $escape($intro) . '</p><ul>' . $items . '</ul></section>';
    $updated = preg_replace('~</main>~i', $section . '</main>', $html, 1, $count);
    if ($count !== 1 || !is_string($updated)) return $html;
    if (!str_contains($updated, '/assets/velq-seo-related.css')) {
        $updated = preg_replace('~</head>~i', '<link rel="stylesheet" href="/assets/velq-seo-related.css?v=20261111"></head>', $updated, 1) ?? $updated;
    }
    return $updated;
}

/** Disclose the existing editorial policy without claiming medical review. */
function velq_growth_editorial_link(string $html, string $path): string
{
    if (!preg_match('~^/blog/(?:what-to-eat-glp1-not-hungry|glp1-protein-snacks-without-shakes|glp1-constipation-fiber|maintain-muscle-glp1-low-appetite|tired-on-glp1-food-fluids-causes)$~', $path)) return $html;
    if (str_contains($html, 'href="/blog/editorial-policy"') || str_contains($html, 'id="velq-editorial-standards"')) return $html;
    $note = '<aside id="velq-editorial-standards" aria-label="Editorial standards"><p><strong>How this article was prepared:</strong> '
        . 'Read our <a href="/blog/editorial-policy">editorial policy and clinical review status</a>. '
        . 'This content is educational and does not replace advice from your clinician or registered dietitian.</p></aside>';
    return preg_replace('~</main>~i', $note . '</main>', $html, 1) ?? $html;
}

/** Deliver source-sized WebP assets to narrow screens without changing hero art or waitlist code. */
function velq_growth_responsive_home_media(string $html): string
{
    $hero = '/assets/velq-cover-cyan-stems-20261104';
    $gym = '/assets/velq-gym-small-packet-20261104';
    $heroSet = $hero . '-480.webp 480w, ' . $hero . '-800.webp 800w, ' . $hero . '.webp 1122w';
    $gymSet = $gym . '-480.webp 480w, ' . $gym . '-800.webp 800w, '
        . $gym . '-1200.webp 1200w, ' . $gym . '.webp 1536w';
    $heroSizes = '(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 560px';
    $gymSizes = '(max-width: 700px) 90vw, 360px';
    $html = preg_replace_callback('~<img\\b[^>]*>~i', static function (array $m) use ($hero, $gym, $heroSet, $gymSet, $heroSizes, $gymSizes): string {
        $tag = $m[0];
        if (preg_match('~\\ssrcset\\s*=~i', $tag)) return $tag;
        if (str_contains($tag, 'src="' . $hero . '.webp"') && str_contains($tag, 'approved-cover-art')) {
            return preg_replace('~\\s*(/?>)$~', ' srcset="' . $heroSet . '" sizes="' . $heroSizes . '"$1', $tag, 1) ?? $tag;
        }
        if (str_contains($tag, 'src="' . $gym . '.webp"')) {
            return preg_replace('~\\s*(/?>)$~', ' srcset="' . $gymSet . '" sizes="' . $gymSizes . '"$1', $tag, 1) ?? $tag;
        }
        return $tag;
    }, $html) ?? $html;

    if (!str_contains($html, 'src="' . $hero . '.webp"')) return $html;
    $preload = '<link data-velq-responsive-preload rel="preload" as="image" href="' . $hero . '-800.webp"'
        . ' imagesrcset="' . $heroSet . '" imagesizes="' . $heroSizes . '" fetchpriority="high">';
    if (preg_match('~<link\\b[^>]*data-velq-responsive-preload[^>]*>~i', $html)) {
        return preg_replace('~<link\\b[^>]*data-velq-responsive-preload[^>]*>~i', $preload, $html, 1) ?? $html;
    }
    return preg_replace('~</head>~i', $preload . '</head>', $html, 1) ?? $html;
}

function velq_growth_response(string $html, string $requestPath): string
{
    $path = preg_replace('~/index\.html$~', '', $requestPath) ?? $requestPath;
    $path = rtrim($path, '/') ?: '/';
    if ($path === '/sitemap.xml') {
        // The four consumer guides were substantively edited on November 16.
        foreach ([
            '/blog/protein-gummies-for-adults',
            '/blog/fiber-gummies-for-adults-guide',
            '/blog/caffeine-gummies-vs-coffee-whats-the-difference',
            '/blog/caffeine-l-theanine-vs-caffeine'
        ] as $consumerPage) {
            $url = 'https://velqnutrition.com' . $consumerPage;
            $pattern = '~(<url>\s*<loc>' . preg_quote($url, '~') . '</loc>\s*)(?:<lastmod>[^<]*</lastmod>)?~';
            $html = preg_replace_callback($pattern, static fn(array $m): string => $m[1] . '<lastmod>2026-11-16</lastmod>', $html, 1) ?? $html;
        }

        // Report substantive page edits with accurate modification dates.
        foreach (['/', '/products/strawberry-protein-fiber-gummies', '/blog/protein-and-fiber-gummies-buying-guide', '/blog/best-fiber-gummies-2026', '/blog/what-to-eat-glp1-not-hungry', '/blog/glp1-protein-snacks-without-shakes', '/blog/glp1-constipation-fiber', '/blog/maintain-muscle-glp1-low-appetite', '/blog/tired-on-glp1-food-fluids-causes'] as $page) {
            $url = 'https://velqnutrition.com' . $page;
            $pattern = '~(<url>\s*<loc>' . preg_quote($url, '~') . '</loc>\s*)(?:<lastmod>[^<]*</lastmod>)?~';
            $html = preg_replace_callback($pattern, static fn(array $m): string => $m[1] . '<lastmod>2026-11-11</lastmod>', $html, 1) ?? $html;
        }
        // Surface the canonical wholesale inquiry page in the generated sitemap.
        $wholesaleUrl = 'https://velqnutrition.com/wholesale/';
        if (str_contains($html, '</urlset>') && !str_contains($html, '<loc>' . $wholesaleUrl . '</loc>')) {
            $html = str_replace('</urlset>', '<url><loc>' . $wholesaleUrl . '</loc><lastmod>2026-11-17</lastmod></url>' . "\n" . '</urlset>', $html);
        }
        // Keep the wholesale last-modified date accurate when earlier filters generated the URL.
        $wholesalePattern = '~(<url>\\s*<loc>' . preg_quote($wholesaleUrl, '~') . '</loc>\\s*)(?:<lastmod>[^<]*</lastmod>)?~';
        $html = preg_replace_callback($wholesalePattern, static fn(array $m): string => $m[1] . '<lastmod>2026-11-17</lastmod>', $html, 1) ?? $html;
        // Only these pages are substantively updated in the November 14 release.
        foreach (['/', '/compare', '/blog/protein-and-fiber-gummies-buying-guide'] as $updatedPage) {
            $loc = 'https://velqnutrition.com' . $updatedPage;
            $pattern = '~(<url>\\s*<loc>' . preg_quote($loc, '~') . '</loc>\\s*)(?:<lastmod>[^<]*</lastmod>)?~';
            $html = preg_replace_callback($pattern, static fn(array $m): string => $m[1] . '<lastmod>2026-11-14</lastmod>', $html, 1) ?? $html;
        }
        return $html;
    }
    if (stripos($html, '<html') === false) return $html;
    $html = velq_growth_related_links($html, $path);
    $html = velq_growth_editorial_link($html, $path);
    // Existing consumer search pages: answer-first copy and metadata.
    if (in_array($path, [
        '/blog/protein-gummies-for-adults',
        '/blog/fiber-gummies-for-adults-guide',
        '/blog/caffeine-gummies-vs-coffee-whats-the-difference',
        '/blog/caffeine-l-theanine-vs-caffeine'
    ], true)) return velq_growth_consumer_page($html, $path);


    // Keep the existing gummy guide canonical while linking to the product and wholesale pages.
    if ($path === '/guides' && !str_contains($html, 'href="/products/strawberry-protein-fiber-gummies"')) {
        $links = '<p class="velq-guide-product-links">Learn about <a href="/products/strawberry-protein-fiber-gummies">Velq strawberry protein + fiber gummies</a>, or <a href="/wholesale/">request wholesale information for your gym, studio or shop</a>.</p>';
        if (str_contains($html, '</aside>')) {
            $html = preg_replace('~</aside>~i', $links . '</aside>', $html, 1) ?? $html;
        }
        return $html;
    }
    if ($path === '/') {
        $html = str_replace('Strawberry Protein + Fiber &amp; Energy Gummies', 'Strawberry Protein Gummies with Fiber &amp; Caffeine', $html);
        // Avoid promising shipping for a product not yet available for ordering.
        $html = str_replace('FREE SHIPPING ON ORDERS OVER $50', 'VELQ GUMMIES COMING SOON', $html);
        $html = str_replace('aria-label="Free shipping on orders over $50"', 'aria-label="Velq gummies coming soon"', $html);
        $html = velq_growth_responsive_home_media($html);
        if (!str_contains($html, 'rel="preconnect" href="https://cdn.shopify.com"')) {
            $html = preg_replace('~</head>~i', '<link rel="preconnect" href="https://cdn.shopify.com" crossorigin></head>', $html, 1) ?? $html;
        }
        return velq_growth_snippet(
            $html,
            'Protein Gummies with Fiber & Caffeine | Velq',
            'Meet Velq strawberry protein gummies with prebiotic fiber, caffeine and L-theanine. Explore the formula and join the free prelaunch waitlist.'
        );
    }

    if ($path === '/products/strawberry-protein-fiber-gummies') {
        return velq_growth_snippet(
            $html,
            'Protein Gummies with Fiber & Caffeine (Prelaunch) | Velq',
            'Explore Velq strawberry protein gummies with prebiotic fiber, caffeine and L-theanine. See the 10-gummy packet format and join the free launch waitlist.'
        );
    }

    if ($path === '/compare') {
        // Normalize the current ten-gummy format only where the legacy
        // comparison hub describes Velq; competitor labels are unaffected.
        $html = str_replace(
            ['Velq’s planned six-gummy packet', "Velq's planned six-gummy packet"],
            ['Velq’s planned 10-gummy packet', "Velq's planned 10-gummy packet"],
            $html
        );
        $html = str_replace(
            'across Cutfruit, PROTEDY, Kuma, OAKA and Velq',
            'across Cutfruit, Kuma, OAKA and prelaunch Velq',
            $html
        );
        return $html;
    }
    if ($path === '/blog/protein-and-fiber-gummies-buying-guide') {
        // The newer October 20 label review could not reverify PROTEDY; do not present outdated figures as current.
        $html = str_replace(
            'while PROTEDY lists 8 g protein and 4 g fiber across eight gummies',
            'while Kuma’s published Berry Fusion label lists 20 g protein and 3.5 g dietary fiber across ten gummies',
            $html
        );
        $html = str_replace("Velq's prelaunch target is 20 g protein plus 10 g prebiotic fiber in six gummies", "Velq's prelaunch target is 20 g protein plus 10 g prebiotic fiber in 10 gummies", $html);
        $html = str_replace(
            'Grab six strawberry gummy bears and enjoy a little more from your day.',
            'Open your 10-gummy packet and enjoy a little more from your day.',
            $html
        );
        $html = str_replace('Compare Cutfruit, PROTEDY, Kuma and Velq', 'Compare Cutfruit, Kuma, OAKA and prelaunch Velq', $html);
        $html = str_replace('Updated October 14, 2026', 'Updated October 26, 2026', $html);
        $html = str_replace('Get early access to Velq ↗', 'Get the Velq launch details ↗', $html);
        return velq_growth_snippet(
            $html,
            'Protein & Fiber Gummies: 2026 Buying Guide | Velq',
            'How to compare protein and fiber gummies by complete serving, protein source, sugar, caffeine and cost. See the checklist and Velq’s free launch waitlist.'
        );
    }
    if ($path === '/blog/protein-gummies-with-fiber-comparison') {
        return velq_growth_snippet(
            $html,
            'Protein Gummies With Fiber: 2026 Label Comparison | Velq',
            'Compare published Cutfruit, Kuma and OAKA protein gummy labels by protein, fiber, sugar and serving size. See Velq’s formula and free launch waitlist.'
        );
    }
    if ($path === '/blog/best-fiber-gummies-2026') {
        // The published Journal uses a compressed PHP content bundle. Normalize
        // Velq's packet size in that rendered version, not competitor servings.
        $html = str_replace('20 g protein / 6-gummy packet', '20 g protein / 10-gummy packet', $html);
        $html = str_replace('It also describes 6 gummies per packet', 'It also describes 10 gummies per packet', $html);
        $html = preg_replace_callback(
            '~<tr\\b[^>]*>\\s*<td\\b[^>]*>\\s*Velq \\(prelaunch\\)\\s*</td>[\\s\\S]*?</tr>~i',
            static fn(array $m): string => str_replace('6 per packet', '10 per packet', $m[0]),
            $html,
            1
        ) ?? $html;
        return $html;
    }

    return $html;
}


/**
 * Answer-first buying information for the four existing consumer pages.
 * Unlike FAQ rich-result markup, these are visible answers with clear source/
 * commercial disclosures. Don't alter the signup form or make clinical claims.
 */
function velq_growth_consumer_page(string $html, string $path): string
{
    $pages = [
        '/blog/protein-gummies-for-adults' => [
            'title' => 'Protein Gummies for Adults: Serving Sizes & Labels | Velq',
            'description' => 'How to compare protein gummies for adults by protein per full serving, source, sugar, caffeine and cost. Learn about Velq’s prelaunch protein + fiber gummies.',
            'question' => 'Are protein gummies a good source of protein?',
            'answer' => 'That depends on the grams of protein in the complete labeled serving and the protein source. Count all gummies required for a serving; a front-package number alone does not establish protein quality. Compare protein gummies with regular foods, shakes and bars rather than assuming they are interchangeable.',
            'detail' => 'Velq’s development concept contains 10 strawberry gummies per packet with a proposed 20 g protein and 10 g prebiotic fiber. It also includes caffeine. The final product label and availability are not confirmed.',
            'related' => [
                ['/blog/protein-gummies-with-fiber-comparison', 'Compare protein gummies with fiber using manufacturer labels'],
                ['/blog/protein-and-fiber-gummies-buying-guide', 'Read the complete protein + fiber buying guide'],
                ['/products/strawberry-protein-fiber-gummies', 'See Velq’s prelaunch gummy packet']
            ]
        ],
        '/blog/fiber-gummies-for-adults-guide' => [
            'title' => 'Prebiotic Fiber Gummies for Adults: Label Guide | Velq',
            'description' => 'What to look for in prebiotic fiber gummies: fiber types, full-serving grams, sugar, gradual intake and cost. Compare fiber gummy labels and Velq’s prelaunch format.',
            'question' => 'What should you look for in prebiotic fiber gummies?',
            'answer' => 'Check the named fiber ingredient, grams of dietary fiber per full serving, number of gummies, other ingredients and serving directions. Different fibers can behave differently, and “prebiotic” alone does not tell you the dose. Increase fiber gradually and follow product directions.',
            'detail' => 'Velq is developing a strawberry gummy packet with a proposed 10 g prebiotic fiber, 20 g protein and caffeine. It is not a caffeine-free fiber supplement, and its final label is not yet published.',
            'related' => [
                ['/blog/fiber-gummies-vs-psyllium-husk', 'Compare fiber gummies and psyllium'],
                ['/research/gummy-serving-study-2026', 'See the source-based fiber and protein gummy study'],
                ['/blog/protein-gummies-for-adults', 'Compare protein gummy serving sizes']
            ]
        ],
        '/blog/caffeine-gummies-vs-coffee-whats-the-difference' => [
            'title' => 'Caffeine Gummies vs Coffee: Dosage & Safety | Velq',
            'description' => 'Are caffeine gummies stronger than coffee? Compare caffeine milligrams per serving, timing, other ingredients and total daily caffeine before choosing a format.',
            'question' => 'Are caffeine gummies stronger than coffee?',
            'answer' => 'Not inherently. The relevant comparison is milligrams of caffeine in the complete gummy serving versus your actual coffee, which varies by size and preparation. Count caffeine from all sources and consider sleep, sensitivity, medications and age.',
            'detail' => 'Velq’s prelaunch gummy concept lists 80 mg caffeine plus 200 mg L-theanine per 10-gummy packet, alongside protein and fiber. No product-specific energy or focus outcome has been clinically established.',
            'related' => [
                ['/blog/caffeine-l-theanine-vs-caffeine', 'What research says about caffeine and L-theanine'],
                ['/blog/caffeine-gummies-vs-energy-drinks', 'Compare caffeine gummies and energy drinks'],
                ['/products/strawberry-protein-fiber-gummies', 'Review Velq’s prelaunch formula']
            ]
        ],
        '/blog/caffeine-l-theanine-vs-caffeine' => [
            'title' => 'Caffeine + L-Theanine vs Caffeine Alone: Evidence | Velq',
            'description' => 'Review the evidence for caffeine with L-theanine versus caffeine alone, limitations of attention studies, dose comparisons and caffeine safety considerations.',
            'question' => 'Does L-theanine make caffeine jitter-free?',
            'answer' => 'No benefit is guaranteed. Some small human trials found differences on specific attention tasks when caffeine and L-theanine were combined, but their results do not prove that any retail gummy prevents jitters or produces calm focus. Caffeine exposure and individual sensitivity still matter.',
            'detail' => 'Velq’s development formula includes 80 mg caffeine and 200 mg L-theanine per proposed 10-gummy packet. The published studies discussed below did not test Velq; its finished retail label remains pending.',
            'related' => [
                ['/blog/caffeine-gummies-vs-coffee-whats-the-difference', 'Compare caffeine gummies and coffee'],
                ['/blog/protein-gummies-for-adults', 'Understand protein gummy labels'],
                ['/products/strawberry-protein-fiber-gummies', 'Explore the prelaunch Velq product']
            ]
        ]
    ];
    if (!isset($pages[$path]) || str_contains($html, 'data-velq-consumer-summary')) return $html;
    $p = $pages[$path];
    $html = velq_growth_snippet($html, $p['title'], $p['description']);
    $section = '<section data-velq-consumer-summary class="velq-consumer-quick" aria-labelledby="velq-consumer-question">'
        . '<p class="velq-consumer-eyebrow">Quick answer · Buyer checklist</p>'
        . '<h2 id="velq-consumer-question">' . htmlspecialchars($p['question'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</h2>'
        . '<p>' . htmlspecialchars($p['answer'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p>'
        . '<p class="velq-consumer-disclosure">' . htmlspecialchars($p['detail'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . ' Figures are development-stage specifications, not a verified final retail label.</p>'
        . '<p class="velq-consumer-links"><strong>Compare and check:</strong> ';
    $items = [];
    foreach ($p['related'] as [$url, $label]) {
        $items[] = '<a href="' . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . '">' . htmlspecialchars($label, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</a>';
    }
    $section .= implode(' · ', $items) . '</p></section>';
    $updated = preg_replace_callback('~</h1\s*>~i', static fn(array $m): string => $m[0] . $section, $html, 1, $count);
    if (!is_string($updated) || $count !== 1) return $html;
    $html = $updated;
    if (!str_contains($html, '/assets/velq-consumer-search.css')) {
        $html = preg_replace('~</head>~i', '<link rel="stylesheet" href="/assets/velq-consumer-search.css"></head>', $html, 1) ?? $html;
    }
    return $html;
}

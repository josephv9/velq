<?php
declare(strict_types=1);

require_once __DIR__ . '/research-extension.php';
require_once __DIR__ . '/authority-extension.php';
require_once __DIR__ . '/discovery-extension.php';

ob_start(static function (string $html): string {
    // The packed analytics-config.js still contains an obsolete GA4 stream ID.
    // Correct only this script response, before the deferred /analytics.js reads
    // the configuration. Keep all other event/pixel settings unchanged.
    $assetPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
    if ($assetPath === '/analytics-config.js') {
        return str_replace('G-KTHFTZ9XEM', 'G-F93RK1P0H5', $html);
    }
    // MILESTONE3_RESEARCH: include generated sitemap and script responses before
    // the HTML-only image/SEO filter; the waitlist API remains byte-for-byte.
    $html = velq_research_response($html, $assetPath);
    $html = velq_authority_response($html, $assetPath);
    if (stripos($html, '<html') === false) {
        return velq_discovery_response($html, $assetPath);
    }

    $heroImage = '/assets/velq-strawberry-gummies-hero-20261015-v3.jpeg';
    $productImage = '/assets/velq-gummies-packshot-20261015-v2.jpeg';
    $html = str_replace(
        'https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-gummies-primary.jpg?v=1791932884',
        $heroImage,
        $html
    );
    $html = str_replace(
        'https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-gummies-pedestal-packshot-oct2026.jpg?v=1791939285',
        $productImage,
        $html
    );
    // Approved Velq Journal editorial cover refresh. Keep retired articles untouched.
    $html = strtr($html, [
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/protein-vs-fiber-why-your-body-needs-both-cover-oct2026-v3.jpg?v=1791935150" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-protein-vs-fiber-oct2026.jpg?v=1792109199",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/how-much-fiber-do-you-need-every-day-cover-oct2026-v3.jpg?v=1791935155" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-fiber-daily-oct2026.jpg?v=1792109193",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/simple-daily-wellness-routine-that-sticks-cover-oct2026-v3.jpg?v=1791935160" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-wellness-routine-oct2026.jpg?v=1792109238",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-caffeine-coffee-cover.jpg?v=1791605986" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-caffeine-vs-coffee-oct2026.jpg?v=1792109249",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-protein-daily-cover.jpg?v=1791605989" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-protein-needs-oct2026.jpg?v=1792109233",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-caffeine-energy-drinks-cover.jpg?v=1791606001" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-caffeine-vs-energy-drinks-oct2026.jpg?v=1792109254",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-separate-supplements-cover.jpg?v=1791606004" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-gummies-vs-supplements-oct2026.jpg?v=1792109244",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-buying-guide-cover.jpg?v=1791606007" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-buyer-guide-oct2026.jpg?v=1792109222",
    ]);

    // Buyer-intent SEO is applied to rendered HTML only, leaving the waitlist API,
    // packed PHP asset maps, consent and conversion logic unmodified.
    $seoPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $seoPath = preg_replace('~/index\\.html$~', '', $seoPath) ?: '/';
    $seoPath = rtrim($seoPath, '/') ?: '/';

    switch ($seoPath) {
        case '/':
            $html = strtr($html, [
                'Protein and Fiber Gummies | Strawberry | Velq'
                    => 'Strawberry Protein &amp; Prebiotic Fiber Gummies | Velq',
                'Meet Velq strawberry protein and prebiotic fiber gummies, currently in development. Explore gummy buying guides and join the launch waitlist for early access.'
                    => 'Velq strawberry protein and prebiotic fiber gummies are in development, with caffeine and L-theanine planned. Compare gummy servings and join the waitlist.',
            ]);
            $finderLink = '<a class="finder-guide-link" href="/guides/protein-and-fiber-snacks">Read practical snack guides →</a>';
            if (strpos($html, 'data-gummy-buyer-paths="home"') === false) {
                $html = str_replace(
                    $finderLink,
                    $finderLink . '<p data-gummy-buyer-paths="home">Choosing protein and fiber gummies? <a href="/blog/protein-and-fiber-gummies-buying-guide">Start with the protein and prebiotic fiber buying checklist</a>, then <a href="/blog/protein-gummies-with-fiber-comparison">compare protein, fiber and caffeine per complete gummy serving</a>. Velq is prelaunch; the final label may change.</p>',
                    $html
                );
            }
            break;

        case '/guides':
            $html = strtr($html, [
                'Protein &amp; Fiber Gummy Guides | Velq'
                    => 'Protein &amp; Prebiotic Fiber Gummy Guides | Velq',
                'Explore protein and fiber gummies, nutrition labels, serving sizes and practical everyday snack ideas.'
                    => 'Explore protein and prebiotic fiber gummy buying guides. Compare full servings, protein sources, sugar, caffeine and current label examples.',
                'Explore protein and fiber gummy buying guides and practical routines. Compare <a href="/blog/protein-gummies-with-fiber-comparison">protein gummies with fiber</a> across current brands, or see the'
                    => 'Start with the <a href="/blog/protein-and-fiber-gummies-buying-guide">protein and prebiotic fiber gummy buying checklist</a>, then <a href="/blog/protein-gummies-with-fiber-comparison">compare protein gummies with fiber by complete serving</a> across current brands. Or see the',
            ]);
            break;

        case '/compare':
            $html = strtr($html, [
                'Protein and Fiber Gummy Comparisons | Velq'
                    => 'Protein &amp; Fiber Gummies: Serving Comparisons | Velq',
                'Compare protein and fiber gummies with bars and separate supplements. Explore gummy ingredients, labels and the Velq strawberry gummy launch waitlist.'
                    => 'Compare complete protein and prebiotic fiber gummy servings, protein sources, sugar, caffeine and availability. Meet prelaunch Velq strawberry gummies.',
                '<p><a href="/blog/protein-and-fiber-gummies-buying-guide">Read the protein and fiber gummies buying guide →</a></p>'
                    => '<p><a href="/blog/protein-and-fiber-gummies-buying-guide">Learn how to choose protein and prebiotic fiber gummies →</a> · <a href="/blog/protein-gummies-with-fiber-comparison">Compare protein, fiber and caffeine on published serving labels →</a></p>',
            ]);
            break;

        case '/blog/protein-and-fiber-gummies-buying-guide':
            $html = str_replace(
                'Shopping for protein and fiber gummies? Compare serving sizes, protein source, prebiotic fiber, caffeine, sugar and cost before buying.',
                'How to choose protein and prebiotic fiber gummies: compare complete servings, protein sources, sugar, caffeine and cost using a practical buying checklist.',
                $html
            );
            break;

        case '/blog/protein-gummies-with-fiber-comparison':
            $html = strtr($html, [
                'Compare protein gummies with fiber from Cutfruit, PROTEDY, Kuma, OAKA and Velq by protein grams, fiber, sugar, serving size, caffeine and availability.'
                    => 'Compare protein gummies with fiber using published protein, prebiotic fiber, sugar and caffeine labels from Cutfruit, PROTEDY, Kuma, OAKA and prelaunch Velq.',
                'Compare protein gummies with fiber from Cutfruit, PROTEDY, Kuma and Velq by protein grams, fiber, sugar, serving size, caffeine and availability.'
                    => 'Compare gummy protein, prebiotic fiber, sugar and caffeine per labeled serving from Cutfruit, PROTEDY, Kuma, OAKA and prelaunch Velq.',
            ]);
            break;
    }


    // MILESTONE2_NAV: link established commercial pages by real buying intent.
    // No new keyword doorway URLs, changes to analytics events, or waitlist logic.
    $buyerPaths = [
        '/compare' => [
            'Explore the right comparison for your goal',
            'A fiber-only gummy, a protein gummy and fiber powder are different buying decisions. Check full-serving labels, ingredients and current availability.',
            [
                ['/blog/fiber-gummies-vs-fiber-powder', 'Fiber powder vs gummies: serving, ingredients and cost'],
                ['/blog/protein-gummies-for-adults', 'Protein gummies for adults: buying checklist'],
                ['/blog/fiber-gummies-for-adults-guide', 'Fiber gummies for adults: label checklist']
            ]
        ],
        '/guides' => [
            'Choose a focused gummy buying guide',
            'Start with the question that matches your needs. Compare actual labels rather than relying on front-of-pack claims.',
            [
                ['/blog/protein-gummies-for-adults', 'Choosing adult protein gummies'],
                ['/blog/fiber-gummies-for-adults-guide', 'Choosing adult fiber gummies'],
                ['/blog/fiber-gummies-vs-fiber-powder', 'Fiber gummies vs fiber powder']
            ]
        ],
        '/blog/best-fiber-gummies-2026' => [
            'Compare fiber-only gummies with alternative formats',
            'This shortlist uses brand-published label facts, not independently tested product outcomes. Fiber type and directions matter.',
            [
                ['/blog/fiber-gummies-vs-psyllium-husk', 'Fiber gummies vs psyllium: ingredient differences'],
                ['/blog/fiber-gummies-vs-fiber-powder', 'Fiber gummies vs fiber powder: cost and serving size'],
                ['/blog/protein-gummies-with-fiber-comparison', 'Protein gummies with fiber: named-brand comparison']
            ]
        ],
        '/blog/protein-gummies-with-fiber-comparison' => [
            'Continue the protein gummy comparison',
            'Read protein source, sugar, fiber, caffeine and serving size together. The same protein grams do not guarantee equivalent nutrition.',
            [
                ['/blog/protein-and-fiber-gummies-buying-guide', 'Protein and prebiotic fiber gummy buying guide'],
                ['/blog/protein-gummies-vs-protein-bars', 'Protein gummies vs protein bars'],
                ['/blog/protein-and-fiber-gummies-vs-separate-supplements', 'Combined gummies vs separate supplements']
            ]
        ],
        '/blog/protein-and-fiber-gummies-buying-guide' => [
            'Turn the checklist into a buying decision',
            'Compare marketed fiber-only products, combined formulas and the option of taking ingredients separately.',
            [
                ['/blog/best-fiber-gummies-2026', '2026 fiber gummy buyer shortlist'],
                ['/blog/protein-gummies-with-fiber-comparison', 'Named protein and fiber gummy brands'],
                ['/blog/protein-and-fiber-gummies-vs-separate-supplements', 'Combined gummies vs separate protein and fiber']
            ]
        ],
        '/blog/protein-gummies-vs-protein-bars' => [
            'Compare actual labels after choosing your format',
            'A gummy is not automatically a meal replacement. Check the complete serving, protein source, calories, fiber, allergens and caffeine.',
            [
                ['/blog/protein-gummies-with-fiber-comparison', 'Current protein gummy labels and servings'],
                ['/blog/protein-and-fiber-gummies-buying-guide', 'Protein and fiber gummy buyer checklist'],
                ['/blog/protein-and-fiber-gummies-vs-separate-supplements', 'Combined gummies vs separate supplements']
            ]
        ],
        '/blog/fiber-gummies-vs-psyllium-husk' => [
            'Compare the fiber ingredient, not just the format',
            'Psyllium has specific fluid directions. Different fibers are not interchangeable even when their labeled gram amounts match.',
            [
                ['/blog/fiber-gummies-vs-fiber-powder', 'Fiber powder vs gummies: label comparison'],
                ['/blog/best-fiber-gummies-2026', 'Best fiber gummies 2026: buyer shortlist'],
                ['/blog/fiber-gummies-for-adults-guide', 'Fiber gummies for adults: ingredients and servings']
            ]
        ],
        '/blog/protein-and-fiber-gummies-vs-separate-supplements' => [
            'Explore finished product labels before choosing',
            'One combined product may be convenient; separate ingredients may offer more control over serving amounts.',
            [
                ['/blog/protein-gummies-with-fiber-comparison', 'Protein gummies with fiber: brand comparison'],
                ['/blog/protein-and-fiber-gummies-buying-guide', 'Gummy buying checklist'],
                ['/tools/nutrition-label-value-calculator', 'Free calculator: price per complete serving']
            ]
        ],
        '/blog/protein-gummies-for-adults' => [
            'Compare protein gummy buying options',
            'Identify protein source, complete serving, allergens and any declared caffeine before choosing.',
            [
                ['/blog/protein-gummies-with-fiber-comparison', 'Protein gummies with fiber: current brand labels'],
                ['/blog/protein-gummies-vs-protein-bars', 'Protein gummies vs bars'],
                ['/blog/protein-and-fiber-gummies-buying-guide', 'Protein and fiber gummy checklist']
            ]
        ],
        '/blog/fiber-gummies-for-adults-guide' => [
            'Choose a fiber buying comparison',
            'Check the named fiber source, grams per serving, sweeteners and product directions.',
            [
                ['/blog/best-fiber-gummies-2026', 'Fiber gummy buyer shortlist'],
                ['/blog/fiber-gummies-vs-psyllium-husk', 'Fiber gummies vs psyllium'],
                ['/blog/fiber-gummies-vs-fiber-powder', 'Fiber gummies vs powder']
            ]
        ]
    ];
    if (isset($buyerPaths[$seoPath]) && !str_contains($html, 'id="velq-m2-related"')) {
        [$buyerHeading, $buyerIntro, $buyerLinks] = $buyerPaths[$seoPath];
        $safeBuyerText = static fn(string $text): string =>
            htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $buyerBlock = '<section id="velq-m2-related" class="velq-m2-related" aria-labelledby="velq-m2-heading">'
            . '<p class="velq-m2-kicker">COMPARE BEFORE YOU CHOOSE</p>'
            . '<h2 id="velq-m2-heading">' . $safeBuyerText($buyerHeading) . '</h2>'
            . '<p>' . $safeBuyerText($buyerIntro) . '</p><ul class="velq-m2-links">';
        foreach ($buyerLinks as [$url, $label]) {
            $buyerBlock .= '<li><a href="' . $safeBuyerText($url) . '">'
                . $safeBuyerText($label) . ' <span aria-hidden="true">→</span></a></li>';
        }
        $buyerBlock .= '</ul><p class="velq-m2-note">'
            . 'Velq gummies are in development; final nutrition, pricing and availability may change. '
            . '<a href="/#waitlist" data-waitlist-cta="commercial-journey">Get free launch updates</a>'
            . ' — this is not a preorder.</p></section>';
        $buyerOutput = preg_replace('~</main>~i', $buyerBlock . '</main>', $html, 1, $buyerCount);
        if ($buyerCount === 1 && is_string($buyerOutput)) {
            $html = $buyerOutput;
            $html = preg_replace('~</head>~i',
                '<link rel="stylesheet" href="/assets/velq-commercial-m2.css"></head>',
                $html, 1) ?? $html;
        }
    }

    // Bust Hostinger CDN's old /app.js cache on the homepage so visitors load
    // the consented popup and confirmed-receipt logic immediately after deploy.
    if ($seoPath === '/') {
        $html = str_replace('src="/app.js"', 'src="/app.js?v=early-access-20261019"', $html);
    }

    // VELQ_GA4_BOOTSTRAP: exactly one GA4 initializer for each HTML response.
    // The packed /analytics-config.js can be deferred by the upstream.
    // Inject a deferred ID override before /analytics.js so config (G-K),
    // bridge (G-F), then tracker run in the correct order.
    if (stripos($html, '/velq-analytics.js') === false
        && stripos($html, 'gtag/js?id=G-F93RK1P0H5') === false
        && stripos($html, "gtag('config', 'G-F93RK1P0H5'") === false) {
        if (strpos($html, 'src="/analytics.js"') !== false) {
            $withGa4 = preg_replace(
                '~(<script\b[^>]*src="/analytics\.js"[^>]*></script>)~i',
                '<script src="/velq-analytics.js" defer></script>' . "\n" . '$1',
                $html,
                1
            );
        } else {
            // Standalone Journal pages still require ordinary GA4 page views.
            $withGa4 = preg_replace(
                '~(<head\b[^>]*>)~i',
                '$1' . "\n" . '<script src="/velq-analytics.js"></script>',
                $html,
                1
            );
        }
        if (is_string($withGa4)) {
            $html = $withGa4;
        }
    }

    // The approved visual assets now have 480/800/1200 px WebP variants.
    // These are HTML-only replacements; schema and social images remain unchanged.
    if ($seoPath === '/' && strpos($html, 'data-velq-responsive-preload') === false) {
        $preload = '<link data-velq-responsive-preload rel="preload" as="image" href="/assets/velq-strawberry-gummies-hero-20261015-v3-800.webp" imagesrcset="/assets/velq-strawberry-gummies-hero-20261015-v3-480.webp 480w, /assets/velq-strawberry-gummies-hero-20261015-v3-800.webp 800w, /assets/velq-strawberry-gummies-hero-20261015-v3-1200.webp 1200w" imagesizes="(max-width: 650px) 90vw, (max-width: 1100px) 48vw, 560px" fetchpriority="high">';
        $html = preg_replace('~</head>~i', $preload . "\n" . '</head>', $html, 1) ?? $html;
    }

    $html = (string) preg_replace_callback(
        '~<img\b[^>]*>~i',
        static function (array $match): string {
            $variants = [
                '/assets/velq-strawberry-gummies-hero-20261015-v3.jpeg'
                    => '/assets/velq-strawberry-gummies-hero-20261015-v3',
                '/assets/velq-gummies-packshot-20261015-v2.jpeg'
                    => '/assets/velq-gummies-packshot-20261015-v2',
            ];
            foreach ($variants as $original => $base) {
                if (strpos($match[0], $original) === false) {
                    continue;
                }
                $tag = preg_replace('~\s+srcset="[^"]*"~i', '', $match[0]);
                $tag = preg_replace('~\s+sizes="[^"]*"~i', '', $tag);
                $tag = str_replace('src="' . $original . '"', 'src="' . $base . '-800.webp"', $tag);
                $responsive = ' srcset="' . $base . '-480.webp 480w, ' . $base . '-800.webp 800w, ' . $base . '-1200.webp 1200w"'
                    . ' sizes="(max-width: 650px) 90vw, (max-width: 1100px) 48vw, 560px"';
                return preg_replace('~\s*(/?>)$~', $responsive . '$1', $tag, 1) ?? $tag;
            }
            return $match[0];
        },
        $html
    );
    // Run last so image metadata describes the approved, currently served images.
    return velq_discovery_response($html, $assetPath);
});

<?php
declare(strict_types=1);

ob_start(static function (string $html): string {
    if (stripos($html, '<html') === false) {
        return $html;
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

    // VELQ_GA4_BOOTSTRAP: exactly one GA4 initializer for each HTML response.
    // Packed pages load /analytics.js (deferred) and own confirmed signup events.
    // Insert the ID bridge after its script tag, so it runs first without
    // initializing a second gtag instance or changing other pixel settings.
    if (stripos($html, '/velq-analytics.js') === false
        && stripos($html, 'gtag/js?id=G-F93RK1P0H5') === false
        && stripos($html, "gtag('config', 'G-F93RK1P0H5'") === false) {
        if (strpos($html, 'src="/analytics.js"') !== false) {
            $withGa4 = preg_replace(
                '~(<script\b[^>]*src="/analytics\.js"[^>]*></script>)~i',
                '$1' . "\n" . '<script src="/velq-analytics.js"></script>',
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

    return (string) preg_replace_callback(
        '~<img\b[^>]*>~i',
        static function (array $match): string {
            if (strpos($match[0], '/assets/velq-strawberry-gummies-hero-20261015-v3.jpeg') === false
                && strpos($match[0], '/assets/velq-gummies-packshot-20261015-v2.jpeg') === false) {
                return $match[0];
            }
            return (string) preg_replace('~\s+srcset="[^"]*"~i', '', $match[0]);
        },
        $html
    );
});

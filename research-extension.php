<?php
declare(strict_types=1);

/** Extend only the requested research, sitemap, analytics and buyer responses. */
function velq_research_response(string $body, string $requestPath): string
{
    if ($requestPath === '/analytics.js') {
        // Keep the existing sanitization and every confirmed-signup guard.
        // Research paths must survive the established CTA-to-homepage journey.
        $old = 'return /^(?:\\/|\\/compare|\\/blog(?:\\/(?:category\\/)?[a-z0-9-]+)?|\\/guides(?:\\/[a-z0-9-]+)?|\\/tools\\/[a-z0-9-]+)$/.test(path)?path:\'\';';
        $new = 'return /^(?:\\/|\\/compare|\\/research(?:\\/[a-z0-9-]+)?|\\/blog(?:\\/(?:category\\/)?[a-z0-9-]+)?|\\/guides(?:\\/[a-z0-9-]+)?|\\/tools\\/[a-z0-9-]+)$/.test(path)?path:\'\';';
        return str_replace($old, $new, $body);
    }

    if ($requestPath === '/sitemap.xml') {
        return velq_research_sitemap($body);
    }

    if (stripos($body, '<html') === false) return $body;
    $path = preg_replace('~/index\.html$~', '', $requestPath) ?? $requestPath;
    $path = rtrim($path, '/') ?: '/';

    // These established pages answer related serving or label questions.
    // The homepage remains free of extra research script or layout weight.
    $contexts = [
        '/compare' => 'Explore the dated serving evidence',
        '/guides' => 'Put the label checklist into practice',
        '/blog' => 'Original label research and free comparison tools',
        '/blog/best-fiber-gummies-2026' => 'Compare fiber grams per complete gummy serving',
        '/blog/protein-gummies-with-fiber-comparison' => 'Check the serving behind the protein and fiber claim',
        '/blog/protein-and-fiber-gummies-buying-guide' => 'Use the research alongside your buying checklist',
        '/blog/protein-gummies-vs-protein-bars' => 'Compare the amount you actually eat',
        '/blog/protein-and-fiber-gummies-vs-separate-supplements' => 'Calculate each product using its own label',
        '/blog/fiber-gummies-vs-psyllium-husk' => 'Keep labeled fiber amounts and ingredient differences visible',
        '/blog/fiber-gummies-vs-fiber-powder' => 'Use the same serving basis when comparing formats',
        '/blog/protein-gummies-for-adults' => 'Read the serving evidence behind gummy claims',
        '/blog/fiber-gummies-for-adults-guide' => 'Check complete servings before comparing fiber gummies',
        '/tools/protein-fiber-calculator' => 'Turn a daily target into a label-reading question',
    ];

    if (isset($contexts[$path]) && strpos($body, 'id="velq-m3-related"') === false) {
        $heading = htmlspecialchars($contexts[$path], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $module = '<section id="velq-m3-related" class="m3-related" aria-labelledby="velq-m3-heading">'
            . '<p class="eyebrow">VELQ RESEARCH &amp; TOOLS</p><h2 id="velq-m3-heading">' . $heading . '</h2>'
            . '<p>Read the dated manufacturer evidence, compare a complete serving with a single gummy, or calculate value using your own package price.</p>'
            . '<div class="research-links">'
            . '<a href="/research/gummy-serving-study-2026">2026 gummy serving study &amp; downloadable data</a>'
            . '<a href="/tools/serving-comparison-calculator">Serving comparison calculator</a>'
            . '<a href="/tools/nutrition-label-value-calculator">Cost per serving calculator</a>'
            . '</div></section>';
        $updated = preg_replace('~</main>~i', $module . '</main>', $body, 1, $insertions);
        if ($insertions === 1 && is_string($updated)) {
            $body = $updated;
            if (strpos($body, '/assets/research/research.css') === false) {
                $body = preg_replace('~</head>~i', '<link rel="stylesheet" href="/assets/research/research.css"></head>', $body, 1) ?? $body;
            }
        }
    }

    $interactivePages = [
        '/research',
        '/research/gummy-serving-study-2026',
        '/tools/serving-comparison-calculator',
        '/tools/nutrition-label-value-calculator',
    ];
    if (in_array($path, $interactivePages, true)
        && strpos($body, '/assets/research/research-events.js') === false) {
        $body = preg_replace('~</head>~i', '<script src="/assets/research/research-events.js" defer></script></head>', $body, 1) ?? $body;
    }
    return $body;
}

/** Preserve the existing generated sitemap and add only canonical public pages. */
function velq_research_sitemap(string $xml): string
{
    if (strpos($xml, '</urlset>') === false) return $xml;
    $paths = [
        '/research',
        '/research/gummy-serving-study-2026',
        '/tools/serving-comparison-calculator',
        '/tools/nutrition-label-value-calculator',
        '/blog/protein-gummies-with-fiber-comparison',
    ];
    foreach ($paths as $path) {
        $url = 'https://velqnutrition.com' . $path;
        $entry = '<url><loc>' . $url . '</loc><lastmod>2026-10-20</lastmod></url>';
        $pattern = '~<url>\s*<loc>\s*' . preg_quote($url, '~') . '\s*</loc>[\s\S]*?</url>~';
        if (preg_match($pattern, $xml) === 1) {
            $xml = preg_replace($pattern, $entry, $xml, 1) ?? $xml;
        } else {
            $xml = str_replace('</urlset>', $entry . "\n</urlset>", $xml);
        }
    }
    return $xml;
}

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
    if ($path === '/') {
        $heading = 'Explore protein and fiber gummies';
        $intro = 'Compare complete serving labels and learn about Velq before joining the launch list.';
        $links = [
            ['/products/strawberry-protein-fiber-gummies', 'Meet Velq strawberry protein and fiber gummies'],
            ['/blog/protein-gummies-with-fiber-comparison', 'Compare protein gummies with fiber'],
            ['/research/gummy-serving-study-2026', 'Read the 2026 gummy serving-size study'],
        ];
    } elseif ($path === '/products/strawberry-protein-fiber-gummies') {
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

function velq_growth_response(string $html, string $requestPath): string
{
    $path = preg_replace('~/index\.html$~', '', $requestPath) ?? $requestPath;
    $path = rtrim($path, '/') ?: '/';
    if ($path === '/sitemap.xml') {
        // Report substantive page edits with accurate modification dates.
        foreach (['/', '/products/strawberry-protein-fiber-gummies', '/blog/protein-and-fiber-gummies-buying-guide', '/blog/best-fiber-gummies-2026', '/blog/what-to-eat-glp1-not-hungry', '/blog/glp1-protein-snacks-without-shakes', '/blog/glp1-constipation-fiber', '/blog/maintain-muscle-glp1-low-appetite', '/blog/tired-on-glp1-food-fluids-causes'] as $page) {
            $url = 'https://velqnutrition.com' . $page;
            $pattern = '~(<url>\s*<loc>' . preg_quote($url, '~') . '</loc>\s*)(?:<lastmod>[^<]*</lastmod>)?~';
            $html = preg_replace_callback($pattern, static fn(array $m): string => $m[1] . '<lastmod>2026-11-11</lastmod>', $html, 1) ?? $html;
        }
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

    if ($path === '/') {
        $html = str_replace('Strawberry Protein + Fiber &amp; Energy Gummies', 'Strawberry Protein Gummies with Fiber &amp; Caffeine', $html);
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
            'Compare published Cutfruit, Kuma and OAKA protein gummy labels by protein, fiber, sugar and serving size. See Velq’s planned formula and free launch waitlist.'
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

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

function velq_growth_response(string $html, string $requestPath): string
{
    $path = preg_replace('~/index\.html$~', '', $requestPath) ?? $requestPath;
    $path = rtrim($path, '/') ?: '/';
    if ($path === '/sitemap.xml') {
        // Update modification dates only for the three pages actually edited.
        foreach (['/', '/products/strawberry-protein-fiber-gummies', '/blog/protein-and-fiber-gummies-buying-guide'] as $page) {
            $url = 'https://velqnutrition.com' . $page;
            $pattern = '~(<url>\s*<loc>' . preg_quote($url, '~') . '</loc>\s*)(?:<lastmod>[^<]*</lastmod>)?~';
            $html = preg_replace_callback($pattern, static fn(array $m): string => $m[1] . '<lastmod>2026-10-26</lastmod>', $html, 1) ?? $html;
        }
        return $html;
    }
    if (stripos($html, '<html') === false) return $html;

    if ($path === '/') {
        return velq_growth_snippet(
            $html,
            'Strawberry Protein + Fiber Gummies | Velq Waitlist',
            'Velq is developing strawberry protein and prebiotic fiber gummies. Explore the set formula and join the free waitlist for launch news and retail label updates.'
        );
    }

    if ($path === '/blog/protein-and-fiber-gummies-buying-guide') {
        // The newer October 20 label review could not reverify PROTEDY; do not present outdated figures as current.
        $html = str_replace(
            'while PROTEDY lists 8 g protein and 4 g fiber across eight gummies',
            'while Kuma’s published Berry Fusion label lists 20 g protein and 3.5 g dietary fiber across ten gummies',
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
    return $html;
}

<?php
declare(strict_types=1);

/** Discoverability for the first two new Journal articles. */
function velq_new_journal_response(string $html, string $requestPath): string {
    $path = rtrim(preg_replace('~/index\\.html$~', '', $requestPath) ?? $requestPath, '/');
    $articles = [
        '/blog/sugar-free-gummies-vs-no-added-sugar' => 'Sugar-free gummies vs. no added sugar: how to read the label',
        '/blog/high-protein-snacks-to-buy' => 'High-protein snacks to buy: compare six everyday formats',
    ];
    if ($path === '/sitemap.xml') {
        if (!str_contains($html, '</urlset>')) return $html;
        foreach ($articles as $route => $title) {
            $loc = '<loc>https://velqnutrition.com' . $route . '</loc>';
            if (!str_contains($html, $loc)) $html = str_replace('</urlset>', '<url>' . $loc . '</url>' . "\n</urlset>", $html);
        }
        return $html;
    }
    if (stripos($html, '<html') === false || stripos($html, '</main>') === false || str_contains($html, 'id="velq-new-journal-guides"')) return $html;
    $targets = [
        '/blog' => array_keys($articles),
        '/blog/category/protein' => ['/blog/high-protein-snacks-to-buy'],
        '/blog/category/functional-gummies' => ['/blog/sugar-free-gummies-vs-no-added-sugar'],
        '/blog/protein-gummies-for-adults' => ['/blog/high-protein-snacks-to-buy'],
        '/blog/protein-and-fiber-gummies-buying-guide' => ['/blog/sugar-free-gummies-vs-no-added-sugar','/blog/high-protein-snacks-to-buy'],
        '/guides/protein-and-fiber-snacks' => ['/blog/high-protein-snacks-to-buy'],
    ];
    if (!isset($targets[$path])) return $html;
    $links = [];
    foreach ($targets[$path] as $route) {
        if (!str_contains($html, 'href="' . $route . '"')) $links[] = '<a href="' . $route . '">' . htmlspecialchars($articles[$route], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</a>';
    }
    if (!$links) return $html;
    $section = '<section class="growth-related" id="velq-new-journal-guides" aria-labelledby="new-journal-guides-heading"><h2 id="new-journal-guides-heading">Explore more label-reading and shopping guides</h2><p>' . implode(' · ', $links) . '</p></section>';
    return preg_replace_callback('~</main>~i', static fn(array $m): string => $section . "\n" . $m[0], $html, 1) ?? $html;
}

<?php
/**
 * Velq gummy-only buyer SEO enhancements for HTML rendered by the PHP site.
 * Runs after the packed pages render, without changing the waitlist handler,
 * tracking payloads, product formula, or retired powder redirects.
 */
declare(strict_types=1);

function velq_gummy_seo_patch(string $html, string $requestUri): string
{
    if (stripos($html, '<html') === false) {
        return $html;
    }
    $path = parse_url($requestUri, PHP_URL_PATH);
    if (!is_string($path)) {
        return $html;
    }
    $path = rtrim($path, '/') ?: '/';
    if ($path === '/index.html') {
        $path = '/';
    }

    // Separate site/product intent, label-checklist intent, and real comparison intent.
    $pages = [
        '/' => [
            'title' => 'Strawberry Protein & Prebiotic Fiber Gummies | Velq',
            'description' => "Explore Velq's prelaunch strawberry protein and prebiotic fiber gummies, with planned caffeine and L-theanine. Get final formula news and launch updates.",
        ],
        '/guides' => [
            'title' => 'Protein & Prebiotic Fiber Gummy Guides | Velq',
            'description' => 'Use protein and prebiotic fiber gummy guides to compare full servings, ingredients, caffeine, sugar and value. Start with the buying checklist and label table.',
        ],
        '/compare' => [
            'title' => 'Compare Protein & Fiber Gummies by Serving | Velq',
            'description' => 'Compare real protein and fiber gummy servings, ingredients, prebiotic fiber, sugar, caffeine and value. See label comparisons and Velq prelaunch details.',
        ],
        '/blog/protein-and-fiber-gummies-buying-guide' => [
            'title' => 'Protein & Fiber Gummies Buying Guide: Label Checklist | Velq',
            'description' => 'Compare protein and prebiotic fiber gummies by full serving, protein source, sugar, caffeine and cost. Use a free label worksheet. Velq is prelaunch.',
        ],
        '/blog/protein-gummies-with-fiber-comparison' => [
            'title' => 'Protein Gummies With Fiber: 2026 Label Comparison | Velq',
            'description' => 'Compare full protein gummy servings from Cutfruit, PROTEDY, Kuma, OAKA and prelaunch Velq: grams of protein and fiber, gummy count, caffeine and ingredients.',
        ],
    ];
    if (!isset($pages[$path])) {
        return $html;
    }
    $title = htmlspecialchars($pages[$path]['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $description = htmlspecialchars($pages[$path]['description'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $html = (string) preg_replace('~<title\b[^>]*>.*?</title>~is', '<title>' . $title . '</title>', $html, 1);
    // Replace existing standard, Open Graph and Twitter metadata where present.
    foreach ([
        ['name', 'description', $description],
        ['property', 'og:title', $title],
        ['property', 'og:description', $description],
        ['name', 'twitter:title', $title],
        ['name', 'twitter:description', $description],
    ] as [$attribute, $name, $content]) {
        $pattern = '~<meta\b(?=[^>]*\b' . $attribute . '\s*=\s*["\']' . preg_quote($name, '~') . '["\'])[^>]*>~i';
        $html = (string) preg_replace($pattern, '<meta ' . $attribute . '="' . $name . '" content="' . $content . '">', $html, 1);
    }

    if ($path === '/') {
        // Improve useful anchor specificity while keeping the existing, distinct buyer URLs.
        $html = str_replace(
            'Protein gummies with fiber: real 2026 serving comparisons ↗',
            'Compare protein gummies with fiber: 2026 full-serving labels ↗',
            $html
        );
        $html = str_replace(
            'Gummy buying checklist + free label worksheet ↗',
            'Protein + prebiotic fiber gummy buying checklist + worksheet ↗',
            $html
        );
        $html = str_replace(
            'href="/guides/protein-and-fiber-snacks">Read practical snack guides →',
            'href="/guides">Browse protein and prebiotic fiber gummy guides →',
            $html
        );
    } elseif ($path === '/guides') {
        $html = str_replace(
            '<a href="/#waitlist">Get Velq launch updates and early access →</a>',
            '<a href="/#waitlist" data-waitlist-cta="article-end">Get Velq launch updates and early access →</a>',
            $html
        );
        $html = str_replace(
            'Explore protein and fiber gummy buying guides and practical routines. Compare <a href="/blog/protein-gummies-with-fiber-comparison">protein gummies with fiber</a> across current brands, or see the ',
            'Use the <a href="/blog/protein-and-fiber-gummies-buying-guide">protein and prebiotic fiber gummy buying checklist</a> to inspect ingredients and caffeine; then <a href="/blog/protein-gummies-with-fiber-comparison">compare actual protein + fiber gummy serving labels</a> across brands. See the ',
            $html
        );
    } elseif ($path === '/compare') {
        $html = str_replace(
            'Compare protein and prebiotic fiber gummy formats, ingredient labels and serving sizes to find what fits your routine.',
            'Compare complete servings, protein, prebiotic fiber, sugar and caffeine. Start with the <a href="/blog/protein-and-fiber-gummies-buying-guide">gummy buying checklist</a>, then <a href="/blog/protein-gummies-with-fiber-comparison">compare actual 2026 serving labels</a>. Velq’s strawberry formula is prelaunch.',
            $html
        );
    } elseif ($path === '/blog/protein-gummies-with-fiber-comparison') {
        if (strpos($html, 'New to gummy label shopping?') === false) {
            $html = str_replace(
                '<aside class="best-worksheet">',
                '<p>New to gummy label shopping? Start with our <a href="/blog/protein-and-fiber-gummies-buying-guide">protein and prebiotic fiber gummy buying checklist</a> for protein source, caffeine and cost-per-serving questions.</p><aside class="best-worksheet">',
                $html
            );
        }
    }
    return $html;
}

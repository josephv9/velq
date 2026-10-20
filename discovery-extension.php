<?php
declare(strict_types=1);

/**
 * Search-discovery metadata for existing, visible Velq imagery.
 *
 * Run after the current research/authority response filters and photo overrides.
 * This map is deliberately explicit: it neither guesses an image from a filename
 * nor creates new public routes, product claims, licenses or video records.
 */
function velq_discovery_images(): array
{
    static $pages = null;
    if (is_array($pages)) return $pages;
    $base = 'https://velqnutrition.com';
    $cdn = 'https://cdn.shopify.com/s/files/1/0723/8372/5647/';
    $image = static function (string $url, int $width, int $height, string $alt) use ($base): array {
        if (str_starts_with($url, '/')) $url = $base . $url;
        $extension = strtolower(pathinfo(parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION));
        $types = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'png' => 'image/png', 'svg' => 'image/svg+xml'];
        return ['url' => $url, 'width' => $width, 'height' => $height, 'alt' => $alt, 'type' => $types[$extension] ?? ''];
    };
    $page = static fn(array $primary, array $visible = []): array => ['primary' => $primary, 'images' => $visible ?: [$primary['url']]];

    $hero = $image('/assets/velq-strawberry-gummies-hero-20261015-v3.jpeg', 1254, 1254,
        'Development preview of Velq strawberry protein and fiber gummy packaging and gummies. Final details may change.');
    $packshot = $image('/assets/velq-gummies-packshot-20261015-v2-1200.webp', 1200, 1200,
        'Development preview of Velq strawberry gummy packaging. Final packaging and nutrition may change.');
    $legacy = $image($cdn . 'files/velq-red-white-strawberry-final-hero-oct-2026.jpg?v=1791934937', 1254, 1254,
        'Velq strawberry gummy packaging preview. The product is in development and final details may change.');
    $strawberry = $image('/assets/strawberry.webp', 1254, 1254,
        'Velq strawberry gummy package concept. Final product and label details may change.');
    $study = $image('/assets/research/gummy-serving-comparison-2026.png', 1200, 675,
        'Four manufacturer-published fiber gummy labels compared per complete serving and per gummy. Exact figures and source limits are provided in the study.');
    $serving = $image('/assets/discovery/gummy-serving-label-guide.png', 1200, 675,
        'Fictional fiber labels compared per serving and per gummy: 5 grams across two gummies gives 2.5 grams each; 6 grams across three gives 2 grams each.');
    $value = $image('/assets/discovery/nutrition-label-value-guide.png', 1200, 675,
        'Fictional labels show package price divided by servings, then cost normalized to 10 grams protein or 5 grams fiber.');

    $pages = [
        '/' => $page($hero, [
            $base . '/assets/velq-strawberry-gummies-hero-20261015-v3-1200.webp',
            $base . '/assets/velq-gummies-packshot-20261015-v2-1200.webp',
        ]),
        '/media' => $page($packshot, [$base . '/assets/velq-gummies-packshot-20261015-v2-800.webp']),
        '/research' => $page($study, [$base . '/assets/research/gummy-serving-comparison-2026.svg']),
        '/research/gummy-serving-study-2026' => $page($study, [$base . '/assets/research/gummy-serving-comparison-2026.svg']),
        '/tools/serving-comparison-calculator' => $page($serving, [
            $serving['url'], $base . '/assets/discovery/gummy-serving-label-guide.svg',
        ]),
        '/tools/nutrition-label-value-calculator' => $page($value, [
            $value['url'], $base . '/assets/discovery/nutrition-label-value-guide.svg',
        ]),
        '/blog/best-fiber-gummies-2026' => $page($legacy),
        '/blog/protein-gummies-with-fiber-comparison' => $page($legacy),
        '/blog/protein-gummies-for-adults' => $page($strawberry),
        '/blog/fiber-gummies-for-adults-guide' => $page($strawberry),
        '/blog/fiber-gummies-vs-psyllium-husk' => $page($image('/assets/fiber-gummies-vs-psyllium-husk.svg', 1200, 675,
            'Editorial illustration comparing gummy and psyllium powder formats. Ingredient details are explained in the article.')),
        '/blog/caffeine-l-theanine-vs-caffeine' => $page($image('/assets/caffeine-l-theanine-vs-caffeine.svg', 1200, 675,
            'Editorial comparison illustration showing caffeine alone alongside caffeine with L-theanine.')),
    ];

    // These are the final approved cover URLs emitted by image-patch.php and
    // nutrition-content.php. Public image bytes were checked for these sizes.
    $covers = [
        ['protein-vs-fiber-why-your-body-needs-both', 'files/velq-journal-protein-vs-fiber-oct2026.jpg?v=1792109199', 1536, 1024, 'Velq Journal cover for Protein vs. Fiber: Why Your Body Needs Both.'],
        ['how-much-fiber-do-you-need-every-day', '/assets/journal/velq-journal-fiber-daily-20261020-v4.jpg', 1536, 864, 'Velq Journal cover for How Much Fiber Do You Need Every Day?'],
        ['simple-daily-wellness-routine-that-sticks', '/assets/journal/velq-journal-wellness-routine-20261020-v4.jpg', 1536, 864, 'Velq Journal cover for The Simple Daily Wellness Routine That Sticks.'],
        ['caffeine-gummies-vs-coffee-whats-the-difference', 'files/velq-journal-caffeine-vs-coffee-oct2026.jpg?v=1792109249', 1536, 1024, 'Velq Journal cover for the comparison of caffeine gummies and coffee.'],
        ['how-much-protein-do-you-actually-need', '/assets/journal/velq-journal-protein-needs-20261020-v4.jpg', 1536, 864, 'Velq Journal cover for How Much Protein Do You Actually Need?'],
        ['caffeine-gummies-vs-energy-drinks', 'files/velq-journal-caffeine-vs-energy-drinks-oct2026.jpg?v=1792109254', 1536, 1024, 'Velq Journal cover comparing caffeine gummies and energy drinks.'],
        ['protein-and-fiber-gummies-vs-separate-supplements', '/assets/journal/velq-journal-gummies-vs-supplements-20261020-v4.jpg', 1536, 864, 'Velq Journal cover comparing combined protein and fiber gummies with separate supplements.'],
        ['protein-and-fiber-gummies-buying-guide', '/assets/journal/velq-journal-buyer-guide-20261020-v4.jpg', 1536, 864, 'Velq Journal cover for the protein and fiber gummy buying checklist.'],
        ['protein-gummies-vs-protein-bars', '/assets/journal/velq-journal-protein-gummies-vs-bars-20261020-v4.jpg', 1536, 864, 'Velq Journal cover comparing protein gummies and protein bars.'],
        ['fiber-gummies-vs-fiber-powder', '/assets/journal/velq-journal-fiber-gummies-vs-powder-20261020-v4.jpg', 1536, 864, 'Editorial illustration comparing fiber gummies with fiber powder.'],
        ['high-protein-high-fiber-snacks-no-refrigeration', '/assets/journal/velq-journal-snacks-to-go-20261020-v5.jpg', 1536, 864, 'Velq Journal cover for protein and fiber snacks without refrigeration.'],
        ['30-grams-fiber-high-protein-diet', '/assets/journal/velq-journal-fiber-thirty-20261020-v5.jpg', 1536, 864, 'Velq Journal cover for the article about fiber in a high-protein diet.'],
        ['build-muscle-without-protein-shakes', '/assets/journal/velq-journal-build-muscle-20261020-v5.jpg', 1536, 864, 'Velq Journal cover for the food-first muscle-building article.'],
        ['portion-sizes-muscle-gain-without-counting-calories', 'files/velq-portion_sizes_muscle-2026-10.webp?v=1792103448', 1536, 1024, 'Velq Journal cover for the article about portions and muscle gain.'],
        ['what-to-eat-glp1-not-hungry', '/assets/journal/velq-journal-glp1-not-hungry-20261020-v5.jpg', 1536, 864, 'Velq Journal cover for the article about food and low appetite while using a GLP-1 medicine.'],
        ['glp1-protein-snacks-without-shakes', 'files/velq-glp1_protein_snacks-2026-10.webp?v=1792103438', 1536, 1024, 'Velq Journal cover for the article about protein snacks while using a GLP-1 medicine.'],
        ['glp1-constipation-fiber', '/assets/journal/velq-journal-glp1-constipation-20261020-v5.jpg', 1536, 864, 'Velq Journal cover for the article about constipation and fiber while using a GLP-1 medicine.'],
        ['maintain-muscle-glp1-low-appetite', '/assets/journal/velq-journal-glp1-keep-muscle-20261020-v5.jpg', 1536, 864, 'Velq Journal cover for the article about muscle and low appetite while using a GLP-1 medicine.'],
        ['tired-on-glp1-food-fluids-causes', '/assets/journal/velq-journal-glp1-tired-20261020-v5.jpg', 1536, 864, 'Velq Journal cover for the article about tiredness, food and fluids while using a GLP-1 medicine.'],
    ];
    foreach ($covers as [$slug, $file, $width, $height, $alt]) {
        $url = str_starts_with($file, '/') ? $file : $cdn . $file;
        $pages['/blog/' . $slug] = $page($image($url, $width, $height, $alt));
    }
    $pages['/blog/portion-sizes-muscle-gain-without-counting-calories']['images'][] = $base . '/assets/growth/meal-components.svg';
    return $pages;
}

/** Read a quoted HTML attribute without decoding or rebuilding the document. */
function velq_discovery_attribute(string $tag, string $name): ?string
{
    if (preg_match('~\s' . preg_quote($name, '~') . '\s*=\s*(["\'])(.*?)\1~is', $tag, $match) !== 1) return null;
    return html_entity_decode($match[2], ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function velq_discovery_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function velq_discovery_set_attribute(string $tag, string $name, string $value): string
{
    $attribute = $name . '="' . velq_discovery_escape($value) . '"';
    $pattern = '~\s' . preg_quote($name, '~') . '\s*=\s*(["\'])(.*?)\1~is';
    if (preg_match($pattern, $tag) === 1) {
        return preg_replace_callback($pattern, static fn(): string => ' ' . $attribute, $tag, 1) ?? $tag;
    }
    return preg_replace_callback('~\s*(/?>)$~', static fn(array $m): string => ' ' . $attribute . $m[1], $tag, 1) ?? $tag;
}

function velq_discovery_image_object(array $image): array
{
    return ['@type' => 'ImageObject', 'url' => $image['url'], 'contentUrl' => $image['url'],
        'width' => $image['width'], 'height' => $image['height'], 'caption' => $image['alt']];
}

/** Normalize only image fields; other URLs, dates, facts and schema types remain. */
function velq_discovery_normalize_schema(array $node): array
{
    foreach ($node as $key => $value) {
        if (is_array($value)) {
            $node[$key] = velq_discovery_normalize_schema($value);
        } elseif (is_string($value) && in_array($key, ['image', 'logo', 'primaryImageOfPage'], true)
            && str_starts_with($value, '/') && !str_starts_with($value, '//')) {
            $node[$key] = 'https://velqnutrition.com' . $value;
        }
    }
    $types = isset($node['@type']) ? (array) $node['@type'] : [];
    if (!in_array('ImageObject', $types, true)) return $node;
    foreach (['url', 'contentUrl'] as $key) {
        if (isset($node[$key]) && is_string($node[$key]) && str_starts_with($node[$key], '/') && !str_starts_with($node[$key], '//')) {
            $node[$key] = 'https://velqnutrition.com' . $node[$key];
        }
    }
    $url = $node['url'] ?? $node['contentUrl'] ?? '';
    if ($url === 'https://velqnutrition.com/apple-touch-icon.png') {
        $node['width'] = 180;
        $node['height'] = 180;
    }
    return $node;
}

function velq_discovery_schema_entity(array $entity, array $image): array
{
    $types = isset($entity['@type']) ? (array) $entity['@type'] : [];
    if (array_intersect($types, ['WebPage', 'CollectionPage'])) {
        $entity['primaryImageOfPage'] = velq_discovery_image_object($image);
    } elseif (array_intersect($types, ['Article', 'BlogPosting', 'WebApplication'])) {
        $entity['image'] = velq_discovery_image_object($image);
    }
    return $entity;
}

/** Final HTML-only pass; assets, APIs, unknown pages and explicit restrictions survive. */
function velq_discovery_response(string $body, string $requestPath): string
{
    $path = parse_url($requestPath, PHP_URL_PATH);
    if (!is_string($path)) return $body;
    if ($path === '/sitemap.xml') return velq_discovery_sitemap($body);
    $path = preg_replace('~/index\.html$~', '', $path) ?? $path;
    $path = rtrim($path, '/') ?: '/';
    $pages = velq_discovery_images();
    if (!isset($pages[$path]) || stripos($body, '<html') === false || stripos($body, '</head>') === false) return $body;
    $image = $pages[$path]['primary'];

    $body = preg_replace_callback('~(<head\b[^>]*>)([\s\S]*?)(</head>)~i', static function (array $head) use ($image): string {
        $values = [
            'og:image' => $image['url'], 'og:image:secure_url' => $image['url'],
            'og:image:width' => (string) $image['width'], 'og:image:height' => (string) $image['height'],
            'og:image:alt' => $image['alt'], 'og:image:type' => $image['type'],
            'twitter:card' => 'summary_large_image', 'twitter:image' => $image['url'], 'twitter:image:alt' => $image['alt'],
        ];
        $seen = [];
        $robotsTags = [];
        preg_match_all('~<meta\b[^>]*>~i', $head[2], $metaTags);
        foreach ($metaTags[0] as $tag) {
            $name = strtolower(velq_discovery_attribute($tag, 'name') ?? '');
            if (in_array($name, ['robots', 'googlebot', 'bingbot'], true)) {
                $robotsTags[] = strtolower(velq_discovery_attribute($tag, 'content') ?? '');
            }
        }
        $robotRules = implode(',', $robotsTags);
        $mayAddPreview = preg_match('~(?:^|[,\s])(?:none|noindex|noimageindex|nosnippet)(?:[,\s]|$)|max-image-preview\s*:~i', $robotRules) !== 1;
        $hasRobots = false;
        $html = preg_replace_callback('~<meta\b[^>]*>~i', static function (array $match) use ($values, &$seen, &$hasRobots, $mayAddPreview): string {
            $tag = $match[0];
            $property = velq_discovery_attribute($tag, 'property');
            $name = velq_discovery_attribute($tag, 'name');
            $key = strtolower($property ?? $name ?? '');
            if ($key === 'robots') {
                $hasRobots = true;
                if ($mayAddPreview) {
                    $content = rtrim(velq_discovery_attribute($tag, 'content') ?? '', ', ');
                    $tag = velq_discovery_set_attribute($tag, 'content', ($content === '' ? '' : $content . ',') . 'max-image-preview:large');
                }
                return $tag;
            }
            if (!array_key_exists($key, $values)) return $tag;
            if (isset($seen[$key])) return '';
            $seen[$key] = true;
            return velq_discovery_set_attribute($tag, 'content', $values[$key]);
        }, $head[2]) ?? $head[2];
        foreach ($values as $key => $value) {
            if (isset($seen[$key]) || $value === '') continue;
            $attribute = str_starts_with($key, 'og:') ? 'property' : 'name';
            $html .= '<meta ' . $attribute . '="' . $key . '" content="' . velq_discovery_escape($value) . '">';
        }
        if (!$hasRobots && $mayAddPreview) $html .= '<meta name="robots" content="max-image-preview:large">';

        $html = preg_replace_callback('~(<script\b[^>]*>)([\s\S]*?)(</script>)~i', static function (array $script) use ($image): string {
            if (strtolower(velq_discovery_attribute($script[1], 'type') ?? '') !== 'application/ld+json') return $script[0];
            $data = json_decode($script[2], true);
            if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) return $script[0];
            $data = velq_discovery_normalize_schema($data);
            if (isset($data['@graph']) && is_array($data['@graph'])) {
                foreach ($data['@graph'] as $key => $entity) {
                    if (is_array($entity)) $data['@graph'][$key] = velq_discovery_schema_entity($entity, $image);
                }
            } else {
                $data = velq_discovery_schema_entity($data, $image);
            }
            $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
            return is_string($json) ? $script[1] . $json . $script[3] : $script[0];
        }, $html) ?? $html;
        return $head[1] . $html . $head[3];
    }, $body, 1) ?? $body;

    if ($path === '/') {
        $body = preg_replace_callback('~<img\b[^>]*>~i', static function (array $match): string {
            $tag = $match[0];
            if (velq_discovery_attribute($tag, 'id') !== 'hero-image'
                || strpos(velq_discovery_attribute($tag, 'src') ?? '', '/assets/velq-strawberry-gummies-hero-20261015-v3') === false) return $tag;
            // Correct the original square photograph's intrinsic ratio while
            // preserving responsive sources, preload matching and fetch priority.
            $tag = velq_discovery_set_attribute($tag, 'width', '1254');
            return velq_discovery_set_attribute($tag, 'height', '1254');
        }, $body) ?? $body;
    }
    return $body;
}

/** Add image locations to existing canonical entries; never create page URLs. */
function velq_discovery_sitemap(string $xml): string
{
    if (strpos($xml, '</urlset>') === false) return $xml;
    $namespace = 'http://www.google.com/schemas/sitemap-image/1.1';
    if (preg_match('~xmlns:([A-Za-z_][\w.-]*)\s*=\s*(["\'])' . preg_quote($namespace, '~') . '\2~', $xml, $match) === 1) {
        $prefix = $match[1];
    } else {
        $prefix = 'image';
        // Avoid taking over a prefix that another vocabulary already owns.
        if (preg_match('~xmlns:image\s*=~', $xml) === 1) $prefix = 'velqimage';
        $xml = preg_replace_callback('~<urlset\b[^>]*>~', static fn(array $m): string => substr($m[0], 0, -1) . ' xmlns:' . $prefix . '="' . $namespace . '">', $xml, 1) ?? $xml;
    }
    $pages = velq_discovery_images();
    return preg_replace_callback('~<url\b[^>]*>[\s\S]*?</url>~', static function (array $match) use ($pages, $prefix): string {
        $entry = $match[0];
        if (preg_match('~<loc>\s*([^<]+)\s*</loc>~', $entry, $location) !== 1) return $entry;
        $url = html_entity_decode(trim($location[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
        if (!str_starts_with($url, 'https://velqnutrition.com/')) return $entry;
        $path = substr($url, strlen('https://velqnutrition.com'));
        if (!isset($pages[$path])) return $entry;

        // The only old sitemap image is a redirected product alias on Home.
        // Keep any other existing image records while adding the explicit map.
        $imagePattern = '~<' . preg_quote($prefix, '~') . ':image\b[^>]*>[\s\S]*?</' . preg_quote($prefix, '~') . ':image>~';
        if ($path === '/') {
            $entry = preg_replace_callback($imagePattern, static function (array $m): string {
                return strpos($m[0], 'https://velqnutrition.com/assets/velq-fruit-snacks-original.jpg') !== false ? '' : $m[0];
            }, $entry) ?? $entry;
        }
        $existing = [];
        if (preg_match_all('~<' . preg_quote($prefix, '~') . ':loc>\s*([^<]+)\s*</' . preg_quote($prefix, '~') . ':loc>~', $entry, $images)) {
            foreach ($images[1] as $image) $existing[html_entity_decode(trim($image), ENT_QUOTES | ENT_XML1, 'UTF-8')] = true;
        }
        $additions = '';
        foreach ($pages[$path]['images'] as $image) {
            if (isset($existing[$image])) continue;
            $existing[$image] = true;
            $additions .= '<' . $prefix . ':image><' . $prefix . ':loc>'
                . htmlspecialchars($image, ENT_QUOTES | ENT_XML1, 'UTF-8')
                . '</' . $prefix . ':loc></' . $prefix . ':image>';
        }
        // Only these two pages gain new visible instructional content in this
        // release. Do not fabricate fresh dates for unchanged article research.
        if (in_array($path, ['/tools/serving-comparison-calculator', '/tools/nutrition-label-value-calculator'], true)) {
            if (preg_match('~<lastmod>\s*([^<]*)\s*</lastmod>~', $entry, $modified) === 1) {
                // Later genuine edits must keep their later timestamps.
                if (trim($modified[1]) < '2026-10-20') {
                    $entry = preg_replace('~<lastmod>[^<]*</lastmod>~', '<lastmod>2026-10-20</lastmod>', $entry, 1) ?? $entry;
                }
            } else {
                $entry = str_replace('</url>', '<lastmod>2026-10-20</lastmod></url>', $entry);
            }
        }
        return str_replace('</url>', $additions . '</url>', $entry);
    }, $xml) ?? $xml;
}

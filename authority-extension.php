<?php
declare(strict_types=1);

/** Make verified media resources discoverable without changing page or signup content. */
function velq_authority_response(string $body, string $requestPath): string
{
    if ($requestPath === '/analytics.js') {
        // Extend the existing allowlist only; retain sanitization and signup guards.
        $old = 'return /^(?:\\/|\\/compare|\\/research(?:\\/[a-z0-9-]+)?|\\/blog(?:\\/(?:category\\/)?[a-z0-9-]+)?|\\/guides(?:\\/[a-z0-9-]+)?|\\/tools\\/[a-z0-9-]+)$/.test(path)?path:\'\';';
        $new = 'return /^(?:\\/|\\/compare|\\/media|\\/research(?:\\/[a-z0-9-]+)?|\\/blog(?:\\/(?:category\\/)?[a-z0-9-]+)?|\\/guides(?:\\/[a-z0-9-]+)?|\\/tools\\/[a-z0-9-]+)$/.test(path)?path:\'\';';
        return str_replace($old, $new, $body);
    }

    if ($requestPath === '/sitemap.xml') {
        $url = 'https://velqnutrition.com/media';
        if (strpos($body, '</urlset>') !== false && strpos($body, '<loc>' . $url . '</loc>') === false) {
            $body = str_replace('</urlset>', '<url><loc>' . $url . '</loc><lastmod>2026-10-20</lastmod></url>' . "\n</urlset>", $body);
        }
        return $body;
    }

    if (stripos($body, '<html') === false || str_starts_with($requestPath, '/assets/')) return $body;
    if (strpos($body, 'id="velq-authority-links"') !== false || stripos($body, '</footer>') === false) return $body;

    if (preg_match('~<footer\b[^>]*>[\s\S]*?</footer>~i', $body, $footerMatch) !== 1) return $body;
    $links = '';
    $destinations = [
        '/media' => 'Media &amp; resources',
        '/contact/' => 'Contact',
        '/blog/editorial-policy' => 'Editorial policy',
    ];
    foreach ($destinations as $path => $label) {
        $pattern = '~href=["\']' . preg_quote(rtrim($path, '/'), '~') . '/?["\']~i';
        if (preg_match($pattern, $footerMatch[0]) !== 1) {
            $links .= '<a href="' . $path . '">' . $label . '</a>';
        }
    }
    if ($links === '') return $body;
    $links = '<nav id="velq-authority-links" class="velq-authority-links" aria-label="Media and editorial resources">' . $links . '</nav>';
    $body = preg_replace('~</footer>~i', $links . '</footer>', $body, 1) ?? $body;
    if (strpos($body, '/assets/velq-authority-links.css') === false) {
        $body = preg_replace('~</head>~i', '<link rel="stylesheet" href="/assets/velq-authority-links.css"></head>', $body, 1) ?? $body;
    }
    return $body;
}

<?php
declare(strict_types=1);

// Milestone 3 pages use an explicit route map; no user-controlled file paths.
$researchPages = [
    '/research' => 'research/index.html',
    '/research/gummy-serving-study-2026' => 'research/gummy-serving-study-2026/index.html',
    '/tools/serving-comparison-calculator' => 'tools/serving-comparison-calculator/index.html',
    '/tools/nutrition-label-value-calculator' => 'tools/nutrition-label-value-calculator/index.html',
    '/blog/protein-gummies-with-fiber-comparison' => 'blog/protein-gummies-with-fiber-comparison/index.html',
];
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$canonicalPath = is_string($requestPath) ? preg_replace('~/index\.html$~', '', $requestPath) : '';
$canonicalPath = rtrim($canonicalPath ?? '', '/');

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-cache');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: https://cdn.shopify.com https://www.facebook.com https://analytics.tiktok.com https://*.klaviyo.com; style-src 'self'; script-src 'self' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://static.klaviyo.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.facebook.com https://analytics.tiktok.com https://*.klaviyo.com; form-action 'self' https://qusbk4-9s.myshopify.com; frame-ancestors 'none'; base-uri 'self'");
$requestHost = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
if (!in_array($requestHost, ['velqnutrition.com', 'www.velqnutrition.com'], true)) {
    header('X-Robots-Tag: noindex, nofollow');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD');
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Method not allowed.';
    exit;
}

if (!array_key_exists($canonicalPath, $researchPages)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    if ($method !== 'HEAD') echo 'Page not found.';
    exit;
}

$pageFile = __DIR__ . '/' . $researchPages[$canonicalPath];
if (!is_file($pageFile) || !is_readable($pageFile)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    header('Retry-After: 300');
    if ($method !== 'HEAD') echo 'This page is temporarily unavailable.';
    exit;
}

if ($requestPath !== $canonicalPath) {
    $query = $_SERVER['QUERY_STRING'] ?? '';
    // The canonical path is allowlisted. Drop raw control bytes from the query
    // before preserving it in a Location header.
    $query = preg_replace('/[\x00-\x1f\x7f]/', '', $query) ?? '';
    header('Location: ' . $canonicalPath . ($query !== '' ? '?' . $query : ''), true, 301);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
if ($method !== 'HEAD') readfile($pageFile);

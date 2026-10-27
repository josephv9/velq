<?php
declare(strict_types=1);
$requested = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = rtrim(preg_replace('~/index\.html$~', '', $requested) ?? $requested, '/');
if ($path !== '/products/strawberry-protein-fiber-gummies') {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}
if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD');
    exit;
}
if ($requested !== $path) {
    $query = $_SERVER['QUERY_STRING'] ?? '';
    header('Location: ' . $path . ($query !== '' ? '?' . $query : ''), true, 301);
    exit;
}
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: https://cdn.shopify.com https://www.facebook.com https://analytics.tiktok.com https://*.klaviyo.com; style-src 'self'; script-src 'self' https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com https://static.klaviyo.com; connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://www.facebook.com https://analytics.tiktok.com https://*.klaviyo.com; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') readfile(__DIR__ . '/products/strawberry-protein-fiber-gummies/index.html');

<?php
declare(strict_types=1);
require dirname(__DIR__) . '/seo-growth-extension.php';
$paths = [
    '/blog/protein-gummies-for-adults',
    '/blog/fiber-gummies-for-adults-guide',
    '/blog/caffeine-gummies-vs-coffee-whats-the-difference',
    '/blog/caffeine-l-theanine-vs-caffeine'
];
$input = '<html><head><title>Before</title><meta name="description" content="Before">'
    . '<meta property="og:title" content="Before"></head><body><main><h1>Title</h1><h2>Existing</h2></main></body></html>';
foreach ($paths as $path) {
    $out = velq_growth_consumer_page($input, $path);
    if ($out === $input || !str_contains($out, 'data-velq-consumer-summary')
        || str_contains($out, '<title>Before</title>')
        || !str_contains($out, 'href="/assets/velq-consumer-search.css"')) {
        throw new RuntimeException('Consumer page render failed: ' . $path);
    }
    if (substr_count($out, 'data-velq-consumer-summary') !== 1
        || velq_growth_consumer_page($out, $path) !== $out) {
        throw new RuntimeException('Duplicate injection: ' . $path);
    }
}
echo 'PASS: Four consumer pages receive title, description, quick answer and internal links.' . PHP_EOL;

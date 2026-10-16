<?php
declare(strict_types=1);

ob_start(static function (string $html): string {
    if (stripos($html, '<html') === false) {
        return $html;
    }

    $heroImage = '/assets/velq-strawberry-gummies-hero-20261015-v3.jpeg';
    $productImage = '/assets/velq-gummies-packshot-20261015-v2.jpeg';
    $html = str_replace(
        'https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-gummies-primary.jpg?v=1791932884',
        $heroImage,
        $html
    );
    $html = str_replace(
        'https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-gummies-pedestal-packshot-oct2026.jpg?v=1791939285',
        $productImage,
        $html
    );
    // Approved Velq Journal editorial cover refresh. Keep retired articles untouched.
    $html = strtr($html, [
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/protein-vs-fiber-why-your-body-needs-both-cover-oct2026-v3.jpg?v=1791935150" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-protein-vs-fiber-oct2026.jpg?v=1792109199",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/how-much-fiber-do-you-need-every-day-cover-oct2026-v3.jpg?v=1791935155" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-fiber-daily-oct2026.jpg?v=1792109193",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/simple-daily-wellness-routine-that-sticks-cover-oct2026-v3.jpg?v=1791935160" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-wellness-routine-oct2026.jpg?v=1792109238",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-caffeine-coffee-cover.jpg?v=1791605986" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-caffeine-vs-coffee-oct2026.jpg?v=1792109249",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-protein-daily-cover.jpg?v=1791605989" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-protein-needs-oct2026.jpg?v=1792109233",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-caffeine-energy-drinks-cover.jpg?v=1791606001" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-caffeine-vs-energy-drinks-oct2026.jpg?v=1792109254",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-separate-supplements-cover.jpg?v=1791606004" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-gummies-vs-supplements-oct2026.jpg?v=1792109244",
        "https://cdn.shopify.com/s/files/1/0723/8372/5647/articles/velq-buying-guide-cover.jpg?v=1791606007" => "https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-journal-buyer-guide-oct2026.jpg?v=1792109222",
    ]);
    return (string) preg_replace_callback(
        '~<img\b[^>]*>~i',
        static function (array $match): string {
            if (strpos($match[0], '/assets/velq-strawberry-gummies-hero-20261015-v3.jpeg') === false
                && strpos($match[0], '/assets/velq-gummies-packshot-20261015-v2.jpeg') === false) {
                return $match[0];
            }
            return (string) preg_replace('~\s+srcset="[^"]*"~i', '', $match[0]);
        },
        $html
    );
});

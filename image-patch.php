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

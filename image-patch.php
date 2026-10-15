<?php
declare(strict_types=1);

ob_start(static function (string $html): string {
    if (stripos($html, '<html') === false) {
        return $html;
    }

    $newImage = '/assets/velq-strawberry-gummies-product-20261015.jpeg';
    $oldUrls = [
        'https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-gummies-primary.jpg?v=1791932884',
        'https://cdn.shopify.com/s/files/1/0723/8372/5647/files/velq-strawberry-gummies-pedestal-packshot-oct2026.jpg?v=1791939285',
    ];

    $html = str_replace($oldUrls, $newImage, $html);
    return (string) preg_replace_callback(
        '~<img\b[^>]*>~i',
        static function (array $match): string {
            if (strpos($match[0], '/assets/velq-strawberry-gummies-product-20261015.jpeg') === false) {
                return $match[0];
            }
            return (string) preg_replace('~\s+srcset="[^"]*"~i', '', $match[0]);
        },
        $html
    );
});

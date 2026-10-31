<?php
declare(strict_types=1);

/** Use the wordmark traced from the owner's approved bag on every HTML page. */
function velq_bag_wordmark(string $html): string {
    if (stripos($html, '<html') === false) return $html;
    $logo = '<img class="velq-bag-logo" src="/assets/velq-bag-wordmark-20261031.svg" alt="Velq" width="455" height="230" decoding="async">';
    $html = preg_replace_callback(
        '~(<a\b[^>]*\bclass="[^"]*\b(?:wordmark|club-wordmark|cover-home)\b[^"]*"[^>]*>).*?</a>~is',
        static fn(array $m): string => $m[1] . $logo . '</a>',
        $html
    ) ?? $html;
    return str_replace('</head>', '<link rel="stylesheet" href="/assets/velq-bag-wordmark-20261031.css?v=black-footer-20261031"><script defer src="/assets/velq-logo-contrast-20261031.js"></script></head>', $html);
}

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
    // Keep all signup buttons and waitlist CTA links consistent site-wide.
    // Preserve existing hrefs, forms, and consent; change only visible labels.
    $html = preg_replace_callback(
        '~<(a|button)\b[^>]*>.*?</\1>~is',
        static function (array $matches): string {
            return preg_replace(
                '~\b(?:JOIN(?:\s+THE)?(?:\s+FREE)?\s+WAITLIST|GET\s+EARLY\s+ACCESS|GET\s+LAUNCH\s+UPDATES)\b~i',
                'JOIN EARLY ACCESS',
                $matches[0]
            ) ?? $matches[0];
        },
        $html
    ) ?? $html;
    $html = preg_replace(
        '~(aria-label=")(?:Join(?: the)?(?: free)? waitlist|Get early access)(")~i',
        '$1Join Early Access$2',
        $html
    ) ?? $html;
    return str_replace('</head>', '<link rel="stylesheet" href="/assets/velq-bag-wordmark-20261031.css?v=velq-early-access-labels-20261031"><script defer src="/assets/velq-logo-contrast-20261031.js"></script></head>', $html);
}

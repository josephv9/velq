<?php
declare(strict_types=1);

/** One strawberry red for website UI, preserving transparent color opacity. */
function velq_brand_red_css(string $css): string {
    $isRed = static fn(int $r, int $g, int $b): bool =>
        $r >= 75 && $r > $g * 1.6 && $r > $b * 1.2 && ($g - $b) <= $r * 0.12;
    $css = preg_replace_callback('~#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\\b~i',
        static function(array $m) use ($isRed): string {
            $hex = $m[1];
            if (strlen($hex) <= 4) $hex = implode('', array_map(static fn(string $c): string => $c.$c, str_split($hex)));
            if (!$isRed(hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2)))) return $m[0];
            return '#E4002B' . (strlen($hex) === 8 ? substr($hex, 6, 2) : '');
        }, $css) ?? $css;
    return preg_replace_callback('~\\brgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(\\s*,\\s*[\\d.]+)?\\s*\\)~i',
        static function(array $m) use ($isRed): string {
            if (!$isRed((int)$m[1], (int)$m[2], (int)$m[3])) return $m[0];
            return isset($m[4]) && $m[4] !== '' ? 'rgba(228,0,43'.$m[4].')' : 'rgb(228,0,43)';
        }, $css) ?? $css;
}

function velq_brand_red_html(string $html): string {
    $html = preg_replace_callback('~<style\\b[^>]*>.*?</style>~is',
        static fn(array $m): string => velq_brand_red_css($m[0]), $html) ?? $html;
    $html = preg_replace_callback('~\\bstyle=(["\\\'])(.*?)\\1~is',
        static fn(array $m): string => 'style='.$m[1].velq_brand_red_css($m[2]).$m[1], $html) ?? $html;
    // Refresh every same-origin stylesheet so returning visitors receive the same red.
    return preg_replace_callback('~<link\\b[^>]*>~i', static function(array $m): string {
        return preg_replace_callback('~\\bhref=(["\\\'])(/[^"\\\']+\\.css(?:\\?[^"\\\']*)?)\\1~i',
            static function(array $a): string {
                $url = preg_replace('~([?&])brand-red=[^&]*~', '$1', $a[2]) ?? $a[2];
                $url = rtrim($url, '?&');
                return 'href='.$a[1].$url.(strpos($url, '?') === false ? '?' : '&amp;').'brand-red=E4002B-v1'.$a[1];
            }, $m[0]) ?? $m[0];
    }, $html) ?? $html;
}

<?php
declare(strict_types=1);

/**
 * Velq QR 10% claim endpoint.
 * Private credentials live in environment variables or ../velq-qr-private.php,
 * NEVER in this public repository. This endpoint fails closed until enabled.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');

function qr_reply(int $status, string $result, string $message = ''): never {
    http_response_code($status);
    echo json_encode(['ok' => $status < 400, 'status' => $result, 'message' => $message],
        JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function qr_setting(string $key, array $private): string {
    $value = getenv($key);
    if (is_string($value) && $value !== '') return $value;
    return is_string($private[$key] ?? null) ? $private[$key] : '';
}

function qr_origin_ok(array $server): bool {
    $valid = static function (string $value): bool {
        $parts = parse_url($value);
        return is_array($parts) && ($parts['scheme'] ?? '') === 'https'
            && in_array(strtolower((string) ($parts['host'] ?? '')),
                ['velqnutrition.com', 'www.velqnutrition.com'], true)
            && !isset($parts['port'], $parts['user'], $parts['pass']);
    };
    $origin = trim((string) ($server['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '') return $valid($origin);
    $site = strtolower((string) ($server['HTTP_SEC_FETCH_SITE'] ?? ''));
    $referrer = trim((string) ($server['HTTP_REFERER'] ?? ''));
    if ($site === 'same-origin') return $referrer === '' || $valid($referrer);
    return $site === '' && $valid($referrer);
}

function qr_post(string $url, array $payload, array $headers): array {
    $curl = curl_init($url);
    if ($curl === false) throw new RuntimeException('Unable to connect to provider');
    $headers[] = 'Content-Type: application/json';
    $headers[] = 'Accept: application/json';
    curl_setopt_array($curl, [
        CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR),
        CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 12, CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_MAXREDIRS => 0,
    ]);
    $raw = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if (!is_string($raw) || $status === 0) throw new RuntimeException('Provider unavailable');
    return [$status, json_decode($raw, true)];
}

function qr_shopify(string $domain, string $token, string $query, array $variables): array {
    [$status, $response] = qr_post('https://' . $domain . '/admin/api/2026-10/graphql.json',
        ['query' => $query, 'variables' => $variables],
        ['X-Shopify-Access-Token: ' . $token]);
    if ($status !== 200 || !is_array($response) || !empty($response['errors'])) {
        throw new RuntimeException('Shopify request failed');
    }
    return $response['data'] ?? [];
}

function qr_issue_shopify_code(string $domain, string $token, string $code): void {
    // First query prevents a duplicate creation on retry after a network timeout.
    $lookup = qr_shopify($domain, $token,
        'query ($code:String!) { codeDiscountNodeByCode(code:$code) { id codeDiscount { __typename ... on DiscountCodeBasic { title usageLimit appliesOncePerCustomer customerGets { value { ... on DiscountPercentage { percentage } } } } } } }',
        ['code' => $code]);
    $existing = $lookup['codeDiscountNodeByCode']['codeDiscount'] ?? null;
    if (is_array($existing)) {
        $percent = (float) ($existing['customerGets']['value']['percentage'] ?? -1);
        if (($existing['__typename'] ?? '') !== 'DiscountCodeBasic'
            || ($existing['title'] ?? '') !== 'VELQ QR 10% REWARD'
            || (int) ($existing['usageLimit'] ?? 0) !== 1
            || ($existing['appliesOncePerCustomer'] ?? false) !== true
            || abs($percent - 0.1) > 0.00001) {
            throw new RuntimeException('Code collision or unexpected Shopify discount');
        }
        return;
    }
    $mutation = 'mutation ($input: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount:$input) { codeDiscountNode { id } userErrors { field message } } }';
    $data = qr_shopify($domain, $token, $mutation, ['input' => [
        'title' => 'VELQ QR 10% REWARD',
        'code' => $code,
        'startsAt' => gmdate('Y-m-d\TH:i:s\Z'),
        'context' => ['all' => 'ALL'],
        'customerGets' => [
            'value' => ['percentage' => 0.10],
            'items' => ['all' => true],
            'appliesOnOneTimePurchase' => true,
            'appliesOnSubscription' => true,
        ],
        'recurringCycleLimit' => 1,
        'usageLimit' => 1, 'appliesOncePerCustomer' => true,
        'combinesWith' => [
            'orderDiscounts' => false, 'productDiscounts' => false,
            'shippingDiscounts' => false,
        ],
        'tags' => ['VELQ_QR_10'],
    ]]);
    $payload = $data['discountCodeBasicCreate'] ?? [];
    if (!empty($payload['userErrors']) || empty($payload['codeDiscountNode']['id'])) {
        throw new RuntimeException('Shopify rejected the code');
    }
}

function qr_klaviyo(string $path, array $payload, string $token): int {
    $curl = curl_init('https://a.klaviyo.com/api/' . $path);
    if ($curl === false) throw new RuntimeException('Klaviyo unavailable');
    curl_setopt_array($curl, [
        CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($payload, JSON_THROW_ON_ERROR),
        CURLOPT_HTTPHEADER => [
            'Authorization: Klaviyo-API-Key ' . $token,
            'revision: 2026-10-15',
            'Accept: application/vnd.api+json',
            'Content-Type: application/vnd.api+json',
        ],
        CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_TIMEOUT => 12,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if ($response === false) throw new RuntimeException('Klaviyo request timed out');
    return $status;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') qr_reply(405, 'error', 'Method not allowed.');
if (!qr_origin_ok($_SERVER)) qr_reply(403, 'error', 'Please use the Velq claim page.');
if (stripos((string) ($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== 0) {
    qr_reply(415, 'error', 'Invalid request format.');
}
$raw = file_get_contents('php://input', false, null, 0, 2049);
if (!is_string($raw) || strlen($raw) > 2048) qr_reply(400, 'error', 'Invalid request.');
$body = json_decode($raw, true);
if (!is_array($body)) qr_reply(400, 'error', 'Invalid request.');
// Honeypot: don't reveal bot detection.
if (!empty($body['company'])) qr_reply(200, 'processing', 'Check your inbox.');
if (($body['consent'] ?? null) !== true) qr_reply(400, 'error', 'Email consent is required.');
$email = strtolower(trim((string) ($body['email'] ?? '')));
if (strlen($email) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    qr_reply(400, 'error', 'Enter a valid email address.');
}

$privatePath = dirname(__DIR__) . '/velq-qr-private.php';
$private = is_file($privatePath) ? require $privatePath : [];
if (!is_array($private)) $private = [];
$config = [
    'enabled' => qr_setting('VELQ_QR_ENABLED', $private),
    'shopify' => qr_setting('VELQ_QR_SHOPIFY_TOKEN', $private),
    'klaviyo' => qr_setting('VELQ_QR_KLAVIYO_TOKEN', $private),
    'secret' => qr_setting('VELQ_QR_HASH_SECRET', $private),
    'db' => qr_setting('VELQ_QR_DB_PATH', $private),
    'domain' => qr_setting('VELQ_QR_SHOPIFY_DOMAIN', $private) ?: 'qusbk4-9s.myshopify.com',
];
if ($config['enabled'] !== '1' || strlen($config['secret']) < 32
    || $config['shopify'] === '' || $config['klaviyo'] === ''
    || $config['db'] === ''
    || !preg_match('/^[a-z0-9-]+\.myshopify\.com$/D', $config['domain'])
    || !extension_loaded('pdo_sqlite') || !function_exists('curl_init')) {
    qr_reply(503, 'unavailable', 'This offer is being prepared. Please try again later.');
}
$dir = realpath(dirname($config['db']));
$public = realpath((string) ($_SERVER['DOCUMENT_ROOT'] ?? __DIR__));
if ($dir === false || $public === false || !is_writable($dir)
    || ($dir === $public || str_starts_with($dir . '/', $public . '/'))) {
    qr_reply(503, 'unavailable', 'This offer is being prepared. Please try again later.');
}

$emailHash = hash_hmac('sha256', $email, $config['secret']);
$code = 'VELQ10-' . strtoupper(substr(hash_hmac('sha256', 'coupon:' . $email,
    $config['secret']), 0, 16));
$ipHash = hash_hmac('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
    $config['secret']);
$now = time();
try {
    $db = new PDO('sqlite:' . $config['db'], null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    $db->exec('PRAGMA busy_timeout=5000');
    $db->exec('CREATE TABLE IF NOT EXISTS qr_claims (
       email_hash TEXT PRIMARY KEY, code TEXT NOT NULL, state TEXT NOT NULL,
       lease_until INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL,
       updated_at INTEGER NOT NULL)');
    $db->exec('CREATE TABLE IF NOT EXISTS qr_attempts (
       ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL)');
    $db->exec('CREATE INDEX IF NOT EXISTS qr_attempts_rate
       ON qr_attempts(ip_hash,created_at)');

    $db->exec('BEGIN IMMEDIATE');
    $db->prepare('DELETE FROM qr_attempts WHERE created_at < ?')
        ->execute([$now - 3600]);
    $rate = $db->prepare('SELECT COUNT(*) FROM qr_attempts WHERE ip_hash = ?');
    $rate->execute([$ipHash]);
    if ((int) $rate->fetchColumn() >= 30) {
        $db->exec('COMMIT');
        header('Retry-After: 3600');
        qr_reply(429, 'rate_limited', 'Too many attempts. Please try again later.');
    }
    $db->prepare('INSERT INTO qr_attempts(ip_hash,created_at) VALUES (?,?)')
       ->execute([$ipHash, $now]);

    $find = $db->prepare('SELECT state,lease_until FROM qr_claims WHERE email_hash=?');
    $find->execute([$emailHash]);
    $claim = $find->fetch(PDO::FETCH_ASSOC);
    if ($claim && $claim['state'] === 'claimed') {
        $db->exec('COMMIT');
        qr_reply(200, 'already', 'This email has already claimed the 10% offer. Check your inbox.');
    }
    if ($claim && ($claim['state'] === 'sending'
        || (int) $claim['lease_until'] > $now)) {
        $db->exec('COMMIT');
        qr_reply(200, 'processing', 'Your request is being processed. Please check your inbox.');
    }
    if (!$claim) {
        $db->prepare('INSERT INTO qr_claims
           (email_hash,code,state,lease_until,created_at,updated_at)
           VALUES (?,?,?,?,?,?)')
           ->execute([$emailHash, $code, 'reserved', $now + 90, $now, $now]);
        $state = 'reserved';
    } else {
        $state = $claim['state'];
        $db->prepare('UPDATE qr_claims SET lease_until=?,updated_at=? WHERE email_hash=?')
           ->execute([$now + 90, $now, $emailHash]);
    }
    $db->exec('COMMIT');

    if ($state === 'reserved') {
        qr_issue_shopify_code($config['domain'], $config['shopify'], $code);
        $db->prepare("UPDATE qr_claims SET state='issued',lease_until=?,updated_at=?
            WHERE email_hash=?")
           ->execute([time() + 90, time(), $emailHash]);
    }

    // Store the code property BEFORE adding to the list, which triggers email.
    $profileStatus = qr_klaviyo('profile-import', [
        'data' => ['type' => 'profile', 'attributes' => [
            'email' => $email, 'properties' => [
                'velq_qr_discount_code' => $code,
                'velq_qr_source' => 'bag_qr',
            ],
        ]],
    ], $config['klaviyo']);
    if (!in_array($profileStatus, [200, 201], true)) {
        throw new RuntimeException('Could not prepare Klaviyo profile');
    }

    // Atomic no-retry safeguard: an ambiguous network error at this step
    // must NOT generate another email or new code.
    $db->prepare("UPDATE qr_claims SET state='sending',lease_until=0,updated_at=?
        WHERE email_hash=?")->execute([time(), $emailHash]);
    $subscriptionStatus = qr_klaviyo('profile-subscription-bulk-create-jobs', [
        'data' => [
            'type' => 'profile-subscription-bulk-create-job',
            'attributes' => ['profiles' => ['data' => [[
                'type' => 'profile', 'attributes' => [
                    'email' => $email,
                    'subscriptions' => ['email' => ['marketing' => [
                        'consent' => 'SUBSCRIBED',
                    ]]],
                ],
            ]]]],
            'relationships' => ['list' => ['data' => [
                'type' => 'list', 'id' => 'WyrNyv',
            ]]],
        ],
    ], $config['klaviyo']);
    if ($subscriptionStatus !== 202) {
        throw new RuntimeException('Klaviyo did not confirm the email job');
    }
    $db->prepare("UPDATE qr_claims SET state='claimed',updated_at=? WHERE email_hash=?")
       ->execute([time(), $emailHash]);
    qr_reply(200, 'claimed', 'If eligible, your 10% code will arrive by email. Check your inbox.');
} catch (Throwable $error) {
    // No exception body or provider secrets are shown to the customer.
    error_log('VELQ QR: ' . get_class($error) . ': ' . $error->getMessage());
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    if (isset($db) && isset($emailHash)) {
        try {
            // Safe to retry BEFORE send; never retry a potentially queued email.
            $db->prepare("UPDATE qr_claims SET lease_until=0 WHERE email_hash=?
                AND state IN ('reserved','issued')")->execute([$emailHash]);
        } catch (Throwable $ignored) {}
    }
    qr_reply(503, 'unavailable', 'We could not finish your claim. Please try again later.');
}

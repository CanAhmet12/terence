<?php
/**
 * Run on server: php scripts/verify_live_api.php (from backend root: php ../scripts/verify_live_api.php)
 * Or copy to backend and: php verify_live_api.php
 */
$base = '/var/www/terence/nazliyavuz-platform/backend';
chdir($base);
require $base . '/vendor/autoload.php';
$app = require_once $base . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = App\Models\User::where('role', 'student')->first();
if (!$u) {
    fwrite(STDERR, "no student user\n");
    exit(1);
}

$token = Tymon\JWTAuth\Facades\JWTAuth::fromUser($u);

function curlJson(string $url, string $token): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ],
    ]);
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode((string) $body, true) ?: ['_raw' => $body]];
}

$baseUrl = getenv('TERENCE_API_BASE') ?: 'https://terenceegitim.com/api';
$g = curlJson($baseUrl . '/student/goal-engine', $token);
$m = curlJson($baseUrl . '/auth/me', $token);

echo "=== GOAL_ENGINE HTTP {$g['code']} ===\n";
echo json_encode([
    'keys' => array_keys(is_array($g['body']) ? $g['body'] : []),
    'has_days_left' => array_key_exists('days_left', (array) $g['body']),
    'has_days_remaining' => array_key_exists('days_remaining', (array) $g['body']),
    'has_risk' => array_key_exists('risk', (array) $g['body']),
    'has_risk_level' => array_key_exists('risk_level', (array) $g['body']),
    'risk_value' => $g['body']['risk'] ?? null,
    'days_left' => $g['body']['days_left'] ?? null,
    'sample' => $g['body'],
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

echo "=== AUTH_ME HTTP {$m['code']} ===\n";
$user = is_array($m['body']['user'] ?? null) ? $m['body']['user'] : [];
echo json_encode([
    'top_keys' => array_keys((array) $m['body']),
    'user_keys' => array_keys($user),
    'has_nested_goal' => array_key_exists('goal', $user),
    'target_net' => $user['target_net'] ?? null,
    'current_net' => $user['current_net'] ?? null,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

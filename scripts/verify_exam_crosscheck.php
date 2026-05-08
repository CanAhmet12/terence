<?php
$base = '/var/www/terence/nazliyavuz-platform/backend';
chdir($base);
require $base . '/vendor/autoload.php';
$app = require_once $base . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

if (!Schema::hasTable('exam_sessions')) {
    echo json_encode(['error' => 'no_exam_sessions_table']) . "\n";
    exit(0);
}

$statusCounts = DB::table('exam_sessions')
    ->selectRaw('status, count(*) as c')
    ->groupBy('status')
    ->pluck('c', 'status')
    ->toArray();

echo json_encode(['exam_sessions_by_status' => $statusCounts], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

$last = DB::table('exam_sessions')
    ->where('status', 'completed')
    ->whereNotNull('finished_at')
    ->orderByDesc('finished_at')
    ->first(['user_id', 'net_score', 'finished_at', 'id']);

if (!$last) {
    echo json_encode(['message' => 'no_completed_exam_sessions']) . "\n";
    exit(0);
}

$user = DB::table('users')->where('id', $last->user_id)->first(['id', 'email', 'role', 'current_net']);

echo json_encode([
    'exam_session_id' => $last->id,
    'user_id' => $last->user_id,
    'last_session_net_score' => $last->net_score !== null ? (float) $last->net_score : null,
    'finished_at' => $last->finished_at,
    'user_current_net_in_db' => $user ? (float) $user->current_net : null,
    'user_email' => $user->email ?? null,
    'user_role' => $user->role ?? null,
    'match' => $user && $last->net_score !== null
        ? abs((float) $user->current_net - (float) $last->net_score) < 0.001
        : null,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

$sample = DB::table('exam_sessions')
    ->where('status', 'completed')
    ->whereNotNull('finished_at')
    ->orderByDesc('finished_at')
    ->limit(10)
    ->get(['id', 'user_id', 'net_score', 'finished_at']);

$mismatches = [];
foreach ($sample as $row) {
    $u = DB::table('users')->where('id', $row->user_id)->value('current_net');
    if ($u === null && $row->net_score === null) {
        continue;
    }
    if (abs((float) $u - (float) $row->net_score) > 0.001) {
        $mismatches[] = [
            'user_id' => $row->user_id,
            'session_net' => (float) $row->net_score,
            'user_current_net' => (float) $u,
            'finished_at' => $row->finished_at,
        ];
    }
}

echo "=== last_10_completed_sessions_mismatch_vs_users_current_net ===\n";
echo json_encode(['mismatch_count' => count($mismatches), 'mismatches' => $mismatches], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

<?php
/**
 * Sunucuda bir kerelik: tablolar zaten varken Pending kalan eski migration satırlarını ekler.
 * Çalıştır (repo kökünden): php scripts/server_mark_legacy_migrations.php
 */
require __DIR__ . '/../nazliyavuz-platform/backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../nazliyavuz-platform/backend/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$names = [
    '2025_01_15_000001_create_payments_table',
    '2025_01_15_000004_create_assignments_table',
    '2025_01_15_000005_create_lessons_table',
    '2025_01_15_000011_create_video_calls_table',
];

$b = (int) DB::table('migrations')->max('batch') + 1;
foreach ($names as $m) {
    DB::table('migrations')->insertOrIgnore(['migration' => $m, 'batch' => $b]);
}
echo "OK: legacy rows batch={$b}\n";

<?php
$base = '/var/www/terence/nazliyavuz-platform/backend';
chdir($base);
require $base . '/vendor/autoload.php';
$app = require_once $base . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

if (!Schema::hasTable('users')) {
    echo "no users table\n";
    exit(1);
}

$cols = ['target_net', 'current_net', 'exam_date', 'target_exam'];
$missing = [];
foreach ($cols as $c) {
    if (!Schema::hasColumn('users', $c)) {
        $missing[] = $c;
    }
}

$totalStudents = (int) DB::table('users')->where('role', 'student')->count();
$nullTarget = (int) DB::table('users')->where('role', 'student')->whereNull('target_net')->count();
$nullExamDate = null;
if (Schema::hasColumn('users', 'exam_date')) {
    $nullExamDate = (int) DB::table('users')->where('role', 'student')->whereNull('exam_date')->count();
}
$zeroCurrent = (int) DB::table('users')->where('role', 'student')->where(function ($q) {
    $q->whereNull('current_net')->orWhere('current_net', 0);
})->count();

$out = [
    'missing_columns_among_expected' => $missing,
    'student_count' => $totalStudents,
    'students_target_net_null' => $nullTarget,
    'students_target_net_null_pct' => $totalStudents ? round(100 * $nullTarget / $totalStudents, 2) : null,
    'users_has_exam_date_column' => Schema::hasColumn('users', 'exam_date'),
    'students_exam_date_null' => $nullExamDate,
    'students_exam_date_null_pct' => ($nullExamDate !== null && $totalStudents) ? round(100 * $nullExamDate / $totalStudents, 2) : null,
    'students_current_net_zero_or_null' => $zeroCurrent,
];
echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

$sampleCols = ['id', 'email', 'target_net', 'current_net', 'target_exam', 'target_school'];
if (Schema::hasColumn('users', 'exam_date')) {
    $sampleCols[] = 'exam_date';
}
$samples = DB::table('users')
    ->where('role', 'student')
    ->orderByDesc('id')
    ->limit(5)
    ->get($sampleCols);

echo "=== sample_students_last_5_by_id ===\n";
echo json_encode($samples, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n";

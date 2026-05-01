<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'student')
            ->whereNull('grade')
            ->update([
                'grade' => DB::raw("
                    CASE
                        WHEN target_exam = 'LGS' THEN 8
                        ELSE 12
                    END
                "),
            ]);

        if (Schema::hasColumn('users', 'target_exam')) {
            DB::table('users')
                ->where('role', 'student')
                ->whereNull('target_exam')
                ->update(['target_exam' => 'TYT']);
        }

        // MySQL 8+ CHECK constraint; wrapped for compatibility with old engines.
        try {
            DB::statement(
                "ALTER TABLE users ADD CONSTRAINT chk_students_grade_required CHECK (role <> 'student' OR grade IS NOT NULL)"
            );
        } catch (\Throwable) {
            // no-op: fallback to application + middleware enforcement
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'grade')) {
                $table->index(['role', 'grade'], 'users_role_grade_index');
            }
            if (Schema::hasColumn('users', 'role') && Schema::hasColumn('users', 'target_exam')) {
                $table->index(['role', 'target_exam'], 'users_role_target_exam_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_grade_index');
            $table->dropIndex('users_role_target_exam_index');
        });

        try {
            DB::statement("ALTER TABLE users DROP CHECK chk_students_grade_required");
        } catch (\Throwable) {
            // no-op
        }
    }
};

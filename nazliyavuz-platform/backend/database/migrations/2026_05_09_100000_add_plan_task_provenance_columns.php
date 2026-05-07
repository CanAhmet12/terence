<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plan_tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('plan_tasks', 'source')) {
                $table->string('source', 20)->default('student')->after('user_id');
            }
            if (!Schema::hasColumn('plan_tasks', 'assigned_by_user_id')) {
                $table->foreignId('assigned_by_user_id')->nullable()->after('source')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('plan_tasks', 'class_room_id')) {
                $table->foreignId('class_room_id')->nullable()->after('assigned_by_user_id')->constrained('class_rooms')->nullOnDelete();
            }
            if (!Schema::hasColumn('plan_tasks', 'teacher_batch_id')) {
                $table->uuid('teacher_batch_id')->nullable()->after('class_room_id');
            }
            if (!Schema::hasColumn('plan_tasks', 'student_editable')) {
                $table->boolean('student_editable')->default(true)->after('teacher_batch_id');
            }
            if (!Schema::hasColumn('plan_tasks', 'requirement')) {
                $table->string('requirement', 20)->default('optional')->after('student_editable');
            }
            if (!Schema::hasColumn('plan_tasks', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('completed_at');
            }
        });

        if (Schema::hasColumn('plan_tasks', 'source')) {
            DB::table('plan_tasks')->whereNull('source')->update(['source' => 'student']);
            DB::table('plan_tasks')->whereNull('student_editable')->update(['student_editable' => true]);
        }

        Schema::table('plan_tasks', function (Blueprint $table) {
            if (Schema::hasColumn('plan_tasks', 'teacher_batch_id')) {
                $table->index(['teacher_batch_id', 'daily_plan_id'], 'plan_tasks_batch_plan_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('plan_tasks', function (Blueprint $table) {
            try {
                $table->dropIndex('plan_tasks_batch_plan_index');
            } catch (\Throwable) {
                // index may not exist
            }
        });

        Schema::table('plan_tasks', function (Blueprint $table) {
            if (Schema::hasColumn('plan_tasks', 'cancelled_at')) {
                $table->dropColumn('cancelled_at');
            }
            if (Schema::hasColumn('plan_tasks', 'requirement')) {
                $table->dropColumn('requirement');
            }
            if (Schema::hasColumn('plan_tasks', 'student_editable')) {
                $table->dropColumn('student_editable');
            }
            if (Schema::hasColumn('plan_tasks', 'teacher_batch_id')) {
                $table->dropColumn('teacher_batch_id');
            }
            if (Schema::hasColumn('plan_tasks', 'class_room_id')) {
                $table->dropForeign(['class_room_id']);
                $table->dropColumn('class_room_id');
            }
            if (Schema::hasColumn('plan_tasks', 'assigned_by_user_id')) {
                $table->dropForeign(['assigned_by_user_id']);
                $table->dropColumn('assigned_by_user_id');
            }
            if (Schema::hasColumn('plan_tasks', 'source')) {
                $table->dropColumn('source');
            }
        });
    }
};

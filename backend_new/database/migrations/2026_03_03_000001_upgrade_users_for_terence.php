<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // users tablosuna terence platform için gerekli kolonları ekle
        Schema::table('users', function (Blueprint $table) {
            // role enum'a parent ekle
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('student','teacher','admin','parent') NOT NULL DEFAULT 'student'");

            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'grade')) {
                $table->tinyInteger('grade')->nullable()->comment('Sınıf 1-12')->after('phone');
            }
            if (!Schema::hasColumn('users', 'subscription_plan')) {
                $table->enum('subscription_plan', ['free','bronze','plus','pro'])->default('free')->after('grade');
            }
            if (!Schema::hasColumn('users', 'subscription_expires_at')) {
                $table->timestamp('subscription_expires_at')->nullable()->after('subscription_plan');
            }
            if (!Schema::hasColumn('users', 'target_exam')) {
                $table->enum('target_exam', ['LGS','TYT','AYT','TYT-AYT','KPSS'])->nullable()->after('subscription_expires_at');
            }
            if (!Schema::hasColumn('users', 'target_school')) {
                $table->string('target_school')->nullable()->after('target_exam');
            }
            if (!Schema::hasColumn('users', 'target_department')) {
                $table->string('target_department')->nullable()->after('target_school');
            }
            if (!Schema::hasColumn('users', 'target_net')) {
                $table->decimal('target_net', 5, 2)->nullable()->after('target_department');
            }
            if (!Schema::hasColumn('users', 'current_net')) {
                $table->decimal('current_net', 5, 2)->default(0)->after('target_net');
            }
            if (!Schema::hasColumn('users', 'xp_points')) {
                $table->integer('xp_points')->default(0)->after('current_net');
            }
            if (!Schema::hasColumn('users', 'level')) {
                $table->tinyInteger('level')->default(1)->after('xp_points');
            }
            if (!Schema::hasColumn('users', 'daily_reminder_time')) {
                $table->time('daily_reminder_time')->nullable()->after('level');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone','grade','subscription_plan','subscription_expires_at',
                'target_exam','target_school','target_department',
                'target_net','current_net','xp_points','level','daily_reminder_time'
            ]);
        });
    }
};

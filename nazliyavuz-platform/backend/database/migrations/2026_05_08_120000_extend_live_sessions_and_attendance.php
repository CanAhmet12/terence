<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('live_sessions')) {
            Schema::table('live_sessions', function (Blueprint $table) {
                if (!Schema::hasColumn('live_sessions', 'is_public')) {
                    $table->boolean('is_public')->default(false)->after('class_room_id');
                }
                if (!Schema::hasColumn('live_sessions', 'subject_tag')) {
                    $table->string('subject_tag', 160)->nullable()->after('title');
                }
                if (!Schema::hasColumn('live_sessions', 'description')) {
                    $table->text('description')->nullable()->after('subject_tag');
                }
                if (!Schema::hasColumn('live_sessions', 'recording_url')) {
                    $table->string('recording_url', 512)->nullable()->after('daily_room_url');
                }
                if (!Schema::hasColumn('live_sessions', 'started_at')) {
                    $table->timestamp('started_at')->nullable()->after('scheduled_at');
                }
                if (!Schema::hasColumn('live_sessions', 'ended_at')) {
                    $table->timestamp('ended_at')->nullable()->after('started_at');
                }
                if (!Schema::hasColumn('live_sessions', 'max_participants')) {
                    $table->unsignedInteger('max_participants')->nullable()->after('duration_minutes');
                }
            });
        }

        if (!Schema::hasTable('live_session_attendances')) {
            Schema::create('live_session_attendances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('live_session_id')->constrained('live_sessions')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->timestamp('joined_at');
                $table->timestamp('left_at')->nullable();
                $table->timestamps();
                $table->unique(['live_session_id', 'user_id']);
            });
        }

        if (!Schema::hasTable('live_session_reminders')) {
            Schema::create('live_session_reminders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('live_session_id')->constrained('live_sessions')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->timestamp('remind_at');
                $table->string('channel', 32)->default('in_app');
                $table->timestamps();
                $table->index(['user_id', 'remind_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('live_session_reminders');
        Schema::dropIfExists('live_session_attendances');

        if (Schema::hasTable('live_sessions')) {
            Schema::table('live_sessions', function (Blueprint $table) {
                foreach (['max_participants', 'ended_at', 'started_at', 'recording_url', 'description', 'subject_tag', 'is_public'] as $col) {
                    if (Schema::hasColumn('live_sessions', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};

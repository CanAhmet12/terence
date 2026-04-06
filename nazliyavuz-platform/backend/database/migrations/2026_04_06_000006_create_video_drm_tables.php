<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Videos table enhancements
        if (!Schema::hasTable('videos')) {
            Schema::create('videos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('content_item_id')->constrained('course_content_items')->onDelete('cascade');
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('original_file_path');
                $table->string('cdn_url')->nullable();
                $table->integer('duration_seconds')->default(0);
                $table->string('thumbnail_url')->nullable();
                $table->boolean('drm_enabled')->default(true);
                $table->boolean('is_processed')->default(false);
                $table->json('available_qualities')->nullable();
                $table->timestamps();
                
                $table->index('content_item_id');
                $table->index(['drm_enabled', 'is_processed']);
            });
        }

        // Video playbacks tracking
        Schema::create('video_playbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('video_id')->constrained('videos')->onDelete('cascade');
            $table->string('ip_address', 45);
            $table->text('user_agent');
            $table->string('device_id')->nullable();
            $table->string('location')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'video_id', 'started_at']);
            $table->index('device_id');
        });

        // Video analytics
        Schema::create('video_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('video_id')->constrained('videos')->onDelete('cascade');
            $table->integer('watch_duration')->default(0); // seconds
            $table->string('quality_used')->default('auto');
            $table->integer('buffering_count')->default(0);
            $table->decimal('completion_rate', 5, 2)->default(0); // 0-100%
            $table->string('device_type')->default('unknown');
            $table->timestamps();
            
            $table->index(['user_id', 'created_at']);
            $table->index(['video_id', 'created_at']);
        });

        // API request logs table (if not exists)
        if (!Schema::hasTable('api_request_logs')) {
            Schema::create('api_request_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
                $table->string('method', 10);
                $table->string('url');
                $table->string('ip_address', 45);
                $table->text('user_agent')->nullable();
                $table->integer('status_code');
                $table->integer('response_time_ms');
                $table->integer('memory_usage_mb')->nullable();
                $table->json('request_payload')->nullable();
                $table->json('response_payload')->nullable();
                $table->timestamps();
                
                $table->index(['user_id', 'created_at']);
                $table->index(['status_code', 'created_at']);
                $table->index('response_time_ms');
            });
        }

        // Slow query log
        if (!Schema::hasTable('slow_query_log')) {
            Schema::create('slow_query_log', function (Blueprint $table) {
                $table->id();
                $table->text('query');
                $table->integer('execution_time_ms');
                $table->string('connection')->nullable();
                $table->timestamps();
                
                $table->index(['execution_time_ms', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('video_analytics');
        Schema::dropIfExists('video_playbacks');
        Schema::dropIfExists('videos');
        Schema::dropIfExists('slow_query_log');
        Schema::dropIfExists('api_request_logs');
    }
};

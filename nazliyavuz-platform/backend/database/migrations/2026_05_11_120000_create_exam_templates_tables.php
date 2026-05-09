<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('exam_templates')) {
            Schema::create('exam_templates', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('slug', 160)->unique();
                $table->string('exam_type', 32);
                $table->unsignedTinyInteger('grade')->nullable()->comment('null = tüm sınıflar');
                $table->unsignedSmallInteger('duration_minutes')->default(135);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamp('published_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['exam_type', 'is_active', 'published_at']);
            });
        }

        if (! Schema::hasTable('exam_template_questions')) {
            Schema::create('exam_template_questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('exam_template_id')->constrained('exam_templates')->cascadeOnDelete();
                $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
                $table->unsignedInteger('sort_order')->default(0);
                $table->string('section', 120)->nullable();
                $table->timestamps();
                $table->unique(['exam_template_id', 'question_id']);
                $table->index(['exam_template_id', 'sort_order']);
            });
        }

        if (Schema::hasTable('exam_sessions') && ! Schema::hasColumn('exam_sessions', 'exam_template_id')) {
            Schema::table('exam_sessions', function (Blueprint $table) {
                $table->foreignId('exam_template_id')->nullable()->after('user_id')->constrained('exam_templates')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('exam_sessions') && Schema::hasColumn('exam_sessions', 'exam_template_id')) {
            Schema::table('exam_sessions', function (Blueprint $table) {
                $table->dropConstrainedForeignId('exam_template_id');
            });
        }
        Schema::dropIfExists('exam_template_questions');
        Schema::dropIfExists('exam_templates');
    }
};

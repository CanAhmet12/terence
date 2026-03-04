<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // kazanimlar tablosu zaten varsa atla
        if (!Schema::hasTable('kazanimlar')) {
            Schema::create('kazanimlar', function (Blueprint $table) {
                $table->id();
                $table->string('kod', 30)->unique()->comment('Örn: M.8.1.1');
                $table->string('tanim');
                $table->string('subject');
                $table->tinyInteger('grade')->nullable();
                $table->string('unite')->nullable();
                $table->string('konu')->nullable();
                $table->enum('exam_type', ['LGS','TYT','AYT','KPSS','Genel'])->default('Genel');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->index(['subject','grade']);
                $table->index('kod');
            });
        }

        // questions tablosu
        if (!Schema::hasTable('questions')) {
            Schema::create('questions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('topic_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('kazanim_id')->nullable()->constrained('kazanimlar')->nullOnDelete();
                $table->string('kazanim_code', 30)->nullable();
                $table->text('question_text');
                $table->string('question_image_url')->nullable();
                $table->enum('type', ['classic','new_gen','paragraph'])->default('classic');
                $table->enum('difficulty', ['easy','medium','hard'])->default('medium');
                $table->string('subject')->nullable();
                $table->tinyInteger('grade')->nullable();
                $table->enum('exam_type', ['LGS','TYT','AYT','KPSS','Genel'])->default('Genel');
                $table->string('solution_video_url')->nullable();
                $table->text('solution_text')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('total_attempts')->default(0);
                $table->integer('correct_attempts')->default(0);
                $table->decimal('accuracy_rate', 5, 2)->default(0);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index(['subject','grade','difficulty']);
                $table->index('kazanim_code');
            });
        }

        // question_options tablosu
        if (!Schema::hasTable('question_options')) {
            Schema::create('question_options', function (Blueprint $table) {
                $table->id();
                $table->foreignId('question_id')->constrained()->onDelete('cascade');
                $table->string('option_letter', 1);
                $table->text('option_text');
                $table->string('option_image_url')->nullable();
                $table->boolean('is_correct')->default(false);
                $table->integer('sort_order')->default(0);
            });
        }

        // question_answers tablosu
        if (!Schema::hasTable('question_answers')) {
            Schema::create('question_answers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('question_id')->constrained()->onDelete('cascade');
                $table->string('selected_option', 1)->nullable();
                $table->boolean('is_correct')->default(false);
                $table->integer('time_spent_seconds')->default(0);
                $table->string('source')->default('question_bank');
                $table->nullableMorphs('sourceable');
                $table->timestamp('answered_at')->useCurrent();
                $table->timestamps();
                $table->index(['user_id','question_id']);
                $table->index(['user_id','is_correct']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('question_answers');
        Schema::dropIfExists('question_options');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('kazanimlar');
    }
};

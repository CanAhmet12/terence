<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('questions')) {
            Schema::table('questions', function (Blueprint $table) {
                $table->index(['grade', 'exam_type', 'subject'], 'questions_grade_exam_subject_index');
            });
        }

        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->index(['grade', 'exam_type', 'is_active'], 'courses_grade_exam_active_index');
            });
        }

        if (Schema::hasTable('kazanimlar')) {
            Schema::table('kazanimlar', function (Blueprint $table) {
                $table->index(['grade', 'exam_type', 'subject'], 'kazanimlar_grade_exam_subject_index');
            });
        }

        if (Schema::hasTable('exam_answers')) {
            Schema::table('exam_answers', function (Blueprint $table) {
                $table->index(['exam_session_id', 'user_id'], 'exam_answers_session_user_index');
                $table->index(['user_id', 'question_id'], 'exam_answers_user_question_index');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('questions')) {
            Schema::table('questions', function (Blueprint $table) {
                $table->dropIndex('questions_grade_exam_subject_index');
            });
        }

        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->dropIndex('courses_grade_exam_active_index');
            });
        }

        if (Schema::hasTable('kazanimlar')) {
            Schema::table('kazanimlar', function (Blueprint $table) {
                $table->dropIndex('kazanimlar_grade_exam_subject_index');
            });
        }

        if (Schema::hasTable('exam_answers')) {
            Schema::table('exam_answers', function (Blueprint $table) {
                $table->dropIndex('exam_answers_session_user_index');
                $table->dropIndex('exam_answers_user_question_index');
            });
        }
    }
};

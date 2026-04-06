<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Terence Education Platform Performance Indexes
     */
    public function up(): void
    {
        // Courses table indexes
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (!$this->indexExists('courses', 'courses_level_grade_index')) {
                    $table->index(['level', 'grade'], 'courses_level_grade_index');
                }
                if (!$this->indexExists('courses', 'courses_created_by_created_at_index')) {
                    $table->index(['created_by', 'created_at'], 'courses_created_by_created_at_index');
                }
            });
        }

        // Course enrollments indexes
        if (Schema::hasTable('course_enrollments')) {
            Schema::table('course_enrollments', function (Blueprint $table) {
                // Use completion_percentage (actual column name in DB)
                if (!$this->indexExists('course_enrollments', 'enrollments_user_progress_index')) {
                    if (Schema::hasColumn('course_enrollments', 'completion_percentage')) {
                        $table->index(['user_id', 'completion_percentage'], 'enrollments_user_progress_index');
                    }
                }
                if (!$this->indexExists('course_enrollments', 'enrollments_course_completed_index')) {
                    if (Schema::hasColumn('course_enrollments', 'completed_at')) {
                        $table->index(['course_id', 'completed_at'], 'enrollments_course_completed_index');
                    }
                }
                if (!$this->indexExists('course_enrollments', 'enrollments_user_course_unique')) {
                    $table->unique(['user_id', 'course_id'], 'enrollments_user_course_unique');
                }
            });
        }

        // Student progress indexes
        if (Schema::hasTable('student_progress')) {
            Schema::table('student_progress', function (Blueprint $table) {
                if (!$this->indexExists('student_progress', 'progress_user_content_index')) {
                    $table->index(['user_id', 'content_item_id'], 'progress_user_content_index');
                }
                if (!$this->indexExists('student_progress', 'progress_user_updated_index')) {
                    $table->index(['user_id', 'updated_at'], 'progress_user_updated_index');
                }
                if (!$this->indexExists('student_progress', 'progress_completed_at_index')) {
                    $table->index(['completed_at'], 'progress_completed_at_index');
                }
            });
        }

        // Questions table indexes
        if (Schema::hasTable('questions')) {
            Schema::table('questions', function (Blueprint $table) {
                if (!$this->indexExists('questions', 'questions_topic_difficulty_index')) {
                    $table->index(['topic_id', 'difficulty'], 'questions_topic_difficulty_index');
                }
                // Use kazanim_code instead of achievement_code (actual column name)
                if (!$this->indexExists('questions', 'questions_kazanim_difficulty_index')) {
                    if (Schema::hasColumn('questions', 'kazanim_code')) {
                        $table->index(['kazanim_code', 'difficulty'], 'questions_kazanim_difficulty_index');
                    }
                }
                // Use grade instead of level
                if (!$this->indexExists('questions', 'questions_subject_grade_index')) {
                    if (Schema::hasColumn('questions', 'grade')) {
                        $table->index(['subject', 'grade'], 'questions_subject_grade_index');
                    }
                }
            });
        }

        // Question answers indexes
        if (Schema::hasTable('question_answers')) {
            Schema::table('question_answers', function (Blueprint $table) {
                if (!$this->indexExists('question_answers', 'answers_user_correct_index')) {
                    $table->index(['user_id', 'is_correct', 'created_at'], 'answers_user_correct_index');
                }
                if (!$this->indexExists('question_answers', 'answers_question_user_index')) {
                    $table->index(['question_id', 'user_id'], 'answers_question_user_index');
                }
                // Skip achievement_code index if column doesn't exist
            });
        }

        // Exam sessions indexes
        if (Schema::hasTable('exam_sessions')) {
            Schema::table('exam_sessions', function (Blueprint $table) {
                if (!$this->indexExists('exam_sessions', 'sessions_user_status_index')) {
                    $table->index(['user_id', 'status', 'started_at'], 'sessions_user_status_index');
                }
                if (!$this->indexExists('exam_sessions', 'sessions_exam_user_index')) {
                    $table->index(['exam_id', 'user_id'], 'sessions_exam_user_index');
                }
                if (!$this->indexExists('exam_sessions', 'sessions_completed_at_index')) {
                    $table->index(['completed_at'], 'sessions_completed_at_index');
                }
            });
        }

        // Daily plans indexes
        if (Schema::hasTable('daily_plans')) {
            Schema::table('daily_plans', function (Blueprint $table) {
                if (!$this->indexExists('daily_plans', 'plans_user_date_index')) {
                    $table->index(['user_id', 'date'], 'plans_user_date_index');
                }
                if (!$this->indexExists('daily_plans', 'plans_user_completed_index')) {
                    $table->index(['user_id', 'completed'], 'plans_user_completed_index');
                }
            });
        }

        // Plan tasks indexes
        if (Schema::hasTable('plan_tasks')) {
            Schema::table('plan_tasks', function (Blueprint $table) {
                if (!$this->indexExists('plan_tasks', 'tasks_plan_status_index')) {
                    $table->index(['plan_id', 'status'], 'tasks_plan_status_index');
                }
                if (!$this->indexExists('plan_tasks', 'tasks_plan_order_index')) {
                    $table->index(['plan_id', 'order'], 'tasks_plan_order_index');
                }
            });
        }

        // Subscriptions indexes
        if (Schema::hasTable('subscriptions')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                if (!$this->indexExists('subscriptions', 'subscriptions_user_status_index')) {
                    $table->index(['user_id', 'status'], 'subscriptions_user_status_index');
                }
                if (!$this->indexExists('subscriptions', 'subscriptions_expires_status_index')) {
                    $table->index(['expires_at', 'status'], 'subscriptions_expires_status_index');
                }
                if (!$this->indexExists('subscriptions', 'subscriptions_plan_active_index')) {
                    $table->index(['plan_type', 'status'], 'subscriptions_plan_active_index');
                }
            });
        }

        // Parent students indexes
        if (Schema::hasTable('parent_students')) {
            Schema::table('parent_students', function (Blueprint $table) {
                if (!$this->indexExists('parent_students', 'parent_students_status_index')) {
                    $table->index(['status'], 'parent_students_status_index');
                }
                if (!$this->indexExists('parent_students', 'parent_students_invite_code_index')) {
                    $table->index(['invite_code'], 'parent_students_invite_code_index');
                }
            });
        }

        // Badges indexes (gamification)
        if (Schema::hasTable('badges')) {
            Schema::table('badges', function (Blueprint $table) {
                // Use category instead of type (actual column name)
                if (!$this->indexExists('badges', 'badges_category_index')) {
                    if (Schema::hasColumn('badges', 'category')) {
                        $table->index(['category'], 'badges_category_index');
                    }
                }
            });
        }

        // User badges indexes
        if (Schema::hasTable('user_badges')) {
            Schema::table('user_badges', function (Blueprint $table) {
                if (!$this->indexExists('user_badges', 'user_badges_user_earned_index')) {
                    $table->index(['user_id', 'earned_at'], 'user_badges_user_earned_index');
                }
                if (!$this->indexExists('user_badges', 'user_badges_badge_user_unique')) {
                    $table->unique(['user_id', 'badge_id'], 'user_badges_badge_user_unique');
                }
            });
        }

        // AI coach conversations indexes
        if (Schema::hasTable('ai_coach_conversations')) {
            Schema::table('ai_coach_conversations', function (Blueprint $table) {
                if (!$this->indexExists('ai_coach_conversations', 'ai_conversations_user_created_index')) {
                    $table->index(['user_id', 'created_at'], 'ai_conversations_user_created_index');
                }
            });
        }

        // Coupons indexes
        if (Schema::hasTable('coupons')) {
            Schema::table('coupons', function (Blueprint $table) {
                if (!$this->indexExists('coupons', 'coupons_code_active_index')) {
                    $table->index(['code', 'is_active'], 'coupons_code_active_index');
                }
                if (!$this->indexExists('coupons', 'coupons_expires_active_index')) {
                    $table->index(['expires_at', 'is_active'], 'coupons_expires_active_index');
                }
            });
        }

        // User suspension indexes
        Schema::table('users', function (Blueprint $table) {
            if (!$this->indexExists('users', 'users_suspended_until_index')) {
                $table->index(['suspended_until'], 'users_suspended_until_index');
            }
            if (!$this->indexExists('users', 'users_teacher_status_index')) {
                $table->index(['teacher_status'], 'users_teacher_status_index');
            }
            if (!$this->indexExists('users', 'users_subscription_expires_index')) {
                $table->index(['subscription_expires_at'], 'users_subscription_expires_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop all Terence-specific indexes
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                $table->dropIndex('courses_level_grade_index');
                $table->dropIndex('courses_created_by_created_at_index');
            });
        }

        if (Schema::hasTable('course_enrollments')) {
            Schema::table('course_enrollments', function (Blueprint $table) {
                $table->dropIndex('enrollments_user_progress_index');
                $table->dropIndex('enrollments_course_completed_index');
                $table->dropIndex('enrollments_user_course_unique');
            });
        }

        if (Schema::hasTable('student_progress')) {
            Schema::table('student_progress', function (Blueprint $table) {
                $table->dropIndex('progress_user_content_index');
                $table->dropIndex('progress_user_updated_index');
                $table->dropIndex('progress_completed_at_index');
            });
        }

        if (Schema::hasTable('questions')) {
            Schema::table('questions', function (Blueprint $table) {
                $table->dropIndex('questions_topic_difficulty_index');
                $table->dropIndex('questions_achievement_difficulty_index');
                $table->dropIndex('questions_subject_level_index');
            });
        }

        if (Schema::hasTable('question_answers')) {
            Schema::table('question_answers', function (Blueprint $table) {
                $table->dropIndex('answers_user_correct_index');
                $table->dropIndex('answers_question_user_index');
                $table->dropIndex('answers_achievement_user_index');
            });
        }

        if (Schema::hasTable('exam_sessions')) {
            Schema::table('exam_sessions', function (Blueprint $table) {
                $table->dropIndex('sessions_user_status_index');
                $table->dropIndex('sessions_exam_user_index');
                $table->dropIndex('sessions_completed_at_index');
            });
        }

        if (Schema::hasTable('daily_plans')) {
            Schema::table('daily_plans', function (Blueprint $table) {
                $table->dropIndex('plans_user_date_index');
                $table->dropIndex('plans_user_completed_index');
            });
        }

        if (Schema::hasTable('plan_tasks')) {
            Schema::table('plan_tasks', function (Blueprint $table) {
                $table->dropIndex('tasks_plan_status_index');
                $table->dropIndex('tasks_plan_order_index');
            });
        }

        if (Schema::hasTable('subscriptions')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->dropIndex('subscriptions_user_status_index');
                $table->dropIndex('subscriptions_expires_status_index');
                $table->dropIndex('subscriptions_plan_active_index');
            });
        }

        if (Schema::hasTable('parent_students')) {
            Schema::table('parent_students', function (Blueprint $table) {
                $table->dropIndex('parent_students_status_index');
                $table->dropIndex('parent_students_invite_code_index');
            });
        }

        if (Schema::hasTable('badges')) {
            Schema::table('badges', function (Blueprint $table) {
                $table->dropIndex('badges_type_category_index');
            });
        }

        if (Schema::hasTable('user_badges')) {
            Schema::table('user_badges', function (Blueprint $table) {
                $table->dropIndex('user_badges_user_earned_index');
                $table->dropIndex('user_badges_badge_user_unique');
            });
        }

        if (Schema::hasTable('ai_coach_conversations')) {
            Schema::table('ai_coach_conversations', function (Blueprint $table) {
                $table->dropIndex('ai_conversations_user_created_index');
            });
        }

        if (Schema::hasTable('coupons')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->dropIndex('coupons_code_active_index');
                $table->dropIndex('coupons_expires_active_index');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_suspended_until_index');
            $table->dropIndex('users_teacher_status_index');
            $table->dropIndex('users_subscription_expires_index');
        });
    }

    /**
     * Check if index exists
     */
    private function indexExists($table, $indexName): bool
    {
        try {
            $indexes = DB::select("SHOW INDEX FROM {$table}");
            foreach ($indexes as $index) {
                if ($index->Key_name === $indexName) {
                    return true;
                }
            }
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }
};

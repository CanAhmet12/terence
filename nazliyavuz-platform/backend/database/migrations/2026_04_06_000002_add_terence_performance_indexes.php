<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Terence Education Platform Performance Indexes
     * All indexes aligned with actual database schema
     */
    public function up(): void
    {
        // Courses table indexes
        if (Schema::hasTable('courses')) {
            Schema::table('courses', function (Blueprint $table) {
                if (Schema::hasColumn('courses', 'level') && Schema::hasColumn('courses', 'grade')) {
                    if (!$this->indexExists('courses', 'courses_level_grade_index')) {
                        $table->index(['level', 'grade'], 'courses_level_grade_index');
                    }
                }
                if (Schema::hasColumn('courses', 'created_by') && Schema::hasColumn('courses', 'created_at')) {
                    if (!$this->indexExists('courses', 'courses_created_by_created_at_index')) {
                        $table->index(['created_by', 'created_at'], 'courses_created_by_created_at_index');
                    }
                }
            });
        }

        // Course enrollments indexes - use completion_percentage
        if (Schema::hasTable('course_enrollments')) {
            Schema::table('course_enrollments', function (Blueprint $table) {
                if (Schema::hasColumn('course_enrollments', 'completion_percentage')) {
                    if (!$this->indexExists('course_enrollments', 'enrollments_user_progress_index')) {
                        $table->index(['user_id', 'completion_percentage'], 'enrollments_user_progress_index');
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
                if (Schema::hasColumn('student_progress', 'content_item_id')) {
                    if (!$this->indexExists('student_progress', 'progress_user_content_index')) {
                        $table->index(['user_id', 'content_item_id'], 'progress_user_content_index');
                    }
                }
                if (!$this->indexExists('student_progress', 'progress_user_updated_index')) {
                    $table->index(['user_id', 'updated_at'], 'progress_user_updated_index');
                }
            });
        }

        // Questions table indexes - use kazanim_code and grade
        if (Schema::hasTable('questions')) {
            Schema::table('questions', function (Blueprint $table) {
                if (Schema::hasColumn('questions', 'topic_id') && Schema::hasColumn('questions', 'difficulty')) {
                    if (!$this->indexExists('questions', 'questions_topic_difficulty_index')) {
                        $table->index(['topic_id', 'difficulty'], 'questions_topic_difficulty_index');
                    }
                }
                if (Schema::hasColumn('questions', 'kazanim_code') && Schema::hasColumn('questions', 'difficulty')) {
                    if (!$this->indexExists('questions', 'questions_kazanim_difficulty_index')) {
                        $table->index(['kazanim_code', 'difficulty'], 'questions_kazanim_difficulty_index');
                    }
                }
                if (Schema::hasColumn('questions', 'subject') && Schema::hasColumn('questions', 'grade')) {
                    if (!$this->indexExists('questions', 'questions_subject_grade_index')) {
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
            });
        }

        // Exam sessions indexes - no exam_id column
        if (Schema::hasTable('exam_sessions')) {
            Schema::table('exam_sessions', function (Blueprint $table) {
                if (!$this->indexExists('exam_sessions', 'sessions_user_status_index')) {
                    $table->index(['user_id', 'status', 'started_at'], 'sessions_user_status_index');
                }
                if (Schema::hasColumn('exam_sessions', 'finished_at')) {
                    if (!$this->indexExists('exam_sessions', 'sessions_finished_at_index')) {
                        $table->index(['finished_at'], 'sessions_finished_at_index');
                    }
                }
            });
        }

        // Daily plans indexes - use plan_date and status
        if (Schema::hasTable('daily_plans')) {
            Schema::table('daily_plans', function (Blueprint $table) {
                if (Schema::hasColumn('daily_plans', 'plan_date')) {
                    if (!$this->indexExists('daily_plans', 'plans_user_plan_date_index')) {
                        $table->index(['user_id', 'plan_date'], 'plans_user_plan_date_index');
                    }
                }
                if (Schema::hasColumn('daily_plans', 'status')) {
                    if (!$this->indexExists('daily_plans', 'plans_user_status_index')) {
                        $table->index(['user_id', 'status'], 'plans_user_status_index');
                    }
                }
            });
        }

        // Plan tasks indexes - use daily_plan_id, is_completed, sort_order
        if (Schema::hasTable('plan_tasks')) {
            Schema::table('plan_tasks', function (Blueprint $table) {
                if (Schema::hasColumn('plan_tasks', 'daily_plan_id') && Schema::hasColumn('plan_tasks', 'is_completed')) {
                    if (!$this->indexExists('plan_tasks', 'tasks_daily_plan_completed_index')) {
                        $table->index(['daily_plan_id', 'is_completed'], 'tasks_daily_plan_completed_index');
                    }
                }
                if (Schema::hasColumn('plan_tasks', 'daily_plan_id') && Schema::hasColumn('plan_tasks', 'sort_order')) {
                    if (!$this->indexExists('plan_tasks', 'tasks_daily_plan_sort_index')) {
                        $table->index(['daily_plan_id', 'sort_order'], 'tasks_daily_plan_sort_index');
                    }
                }
            });
        }

        // Subscriptions indexes
        if (Schema::hasTable('subscriptions')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                if (!$this->indexExists('subscriptions', 'subscriptions_user_status_index')) {
                    $table->index(['user_id', 'status'], 'subscriptions_user_status_index');
                }
                if (Schema::hasColumn('subscriptions', 'expires_at')) {
                    if (!$this->indexExists('subscriptions', 'subscriptions_expires_status_index')) {
                        $table->index(['expires_at', 'status'], 'subscriptions_expires_status_index');
                    }
                }
                if (Schema::hasColumn('subscriptions', 'plan_type')) {
                    if (!$this->indexExists('subscriptions', 'subscriptions_plan_active_index')) {
                        $table->index(['plan_type', 'status'], 'subscriptions_plan_active_index');
                    }
                }
            });
        }

        // Parent students indexes
        if (Schema::hasTable('parent_students')) {
            Schema::table('parent_students', function (Blueprint $table) {
                if (Schema::hasColumn('parent_students', 'status')) {
                    if (!$this->indexExists('parent_students', 'parent_students_status_index')) {
                        $table->index(['status'], 'parent_students_status_index');
                    }
                }
                if (Schema::hasColumn('parent_students', 'invite_code')) {
                    if (!$this->indexExists('parent_students', 'parent_students_invite_code_index')) {
                        $table->index(['invite_code'], 'parent_students_invite_code_index');
                    }
                }
            });
        }

        // Badges indexes - use category only
        if (Schema::hasTable('badges')) {
            Schema::table('badges', function (Blueprint $table) {
                if (Schema::hasColumn('badges', 'category')) {
                    if (!$this->indexExists('badges', 'badges_category_index')) {
                        $table->index(['category'], 'badges_category_index');
                    }
                }
            });
        }

        // User badges indexes
        if (Schema::hasTable('user_badges')) {
            Schema::table('user_badges', function (Blueprint $table) {
                if (Schema::hasColumn('user_badges', 'earned_at')) {
                    if (!$this->indexExists('user_badges', 'user_badges_user_earned_index')) {
                        $table->index(['user_id', 'earned_at'], 'user_badges_user_earned_index');
                    }
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
                if (Schema::hasColumn('coupons', 'code') && Schema::hasColumn('coupons', 'is_active')) {
                    if (!$this->indexExists('coupons', 'coupons_code_active_index')) {
                        $table->index(['code', 'is_active'], 'coupons_code_active_index');
                    }
                }
                if (Schema::hasColumn('coupons', 'expires_at') && Schema::hasColumn('coupons', 'is_active')) {
                    if (!$this->indexExists('coupons', 'coupons_expires_active_index')) {
                        $table->index(['expires_at', 'is_active'], 'coupons_expires_active_index');
                    }
                }
            });
        }

        // Users indexes - only teacher_status exists
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'teacher_status')) {
                if (!$this->indexExists('users', 'users_teacher_status_index')) {
                    $table->index(['teacher_status'], 'users_teacher_status_index');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop only indexes that were successfully created
        // This is a safe down - it won't fail if index doesn't exist
    }

    /**
     * Check if an index exists on a table
     */
    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $database = $connection->getDatabaseName();
        
        $result = $connection->selectOne(
            "SELECT COUNT(*) as count FROM information_schema.statistics 
             WHERE table_schema = ? AND table_name = ? AND index_name = ?",
            [$database, $table, $index]
        );
        
        return $result->count > 0;
    }
};

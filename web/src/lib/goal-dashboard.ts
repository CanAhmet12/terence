import type { EducationPhase, GoalTemplate, GoalUserLike } from "./student-learning-profile"
import {
  goalTemplateLabel,
  resolveGoalTemplateFromUser,
  resolveEducationPhase,
  TARGET_GENEL,
  validateStudentGradeAndTargetExam,
} from "./student-learning-profile"

export type { EducationPhase, GoalTemplate, GoalUserLike }
export {
  goalTemplateLabel,
  resolveGoalTemplateFromUser,
  resolveEducationPhase,
  TARGET_GENEL,
  validateStudentGradeAndTargetExam,
}

export type RiskTier = "on_track" | "at_risk" | "critical"

export interface GoalDashboardUserSnapshot {
  id: number
  name?: string
  grade?: number | null
  target_exam?: string | null
  exam_goal?: string | null
  target_school?: string | null
  target_department?: string | null
  target_net?: number | null
  current_net?: number
  exam_date?: string | null
  streak_days?: number
  xp_points?: number
  /** Backend `GoalDashboardService` — kademe tonlaması */
  education_phase?: EducationPhase
}

export interface GoalDashboardExamMetrics {
  last_completed_exam_net?: number | null
  last_completed_exam_at?: string | null
  last_completed_exam_title?: string | null
  completed_exams_count?: number
  in_progress_exams_count?: number
  user_current_net_db?: number
}

export interface GoalDashboardSchoolMetrics {
  tasks_done_today?: number
  tasks_total_today?: number
  tasks_done_week?: number
  tasks_total_week?: number
  study_time_weekly_seconds?: number
  curriculum_topics_completed?: number
  curriculum_topics_in_progress?: number
}

export interface GoalDashboardInsights {
  days_remaining?: number | null
  weeks_remaining?: number | null
  weekly_net_needed?: number | null
  net_gap?: number | null
  risk_tier: RiskTier
  risk_engine?: string
  weekly_study_minutes?: number
  streak_days?: number
  upgrade_suggestion?: boolean
  task_completion_ratio_today?: number | null
  task_completion_ratio_week?: number | null
  display_current_net?: number | null
  display_target_net?: number | null
}

export interface GoalDataCompleteness {
  missing: string[]
  flags: Record<string, boolean>
}

export interface StudentGoalDashboard {
  success: boolean
  template: GoalTemplate
  user_snapshot: GoalDashboardUserSnapshot
  exam_metrics: GoalDashboardExamMetrics | null
  school_metrics: GoalDashboardSchoolMetrics | null
  insights: GoalDashboardInsights
  data_completeness: GoalDataCompleteness
}

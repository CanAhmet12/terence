export type GoalTemplate = "school_primary" | "exam_lgs" | "exam_yks"

export type RiskTier = "on_track" | "at_risk" | "critical"

/** api.ts içindeki User ile uyumlu minimum alan (döngüsel import yok) */
export type GoalUserLike = {
  grade?: number | string | null
  target_exam?: string | null
  exam_goal?: string | null
}

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

export function resolveGoalTemplateFromUser(user: GoalUserLike | null | undefined): GoalTemplate {
  if (!user) return "exam_yks"
  const exam = user.target_exam ?? user.exam_goal
  if (exam === "LGS") return "exam_lgs"
  const grade = typeof user.grade === "number" ? user.grade : parseInt(String(user.grade ?? "0"), 10)
  if (grade >= 1 && grade <= 6) return "school_primary"
  if (exam === "TYT" || exam === "AYT" || exam === "TYT-AYT" || exam === "KPSS") return "exam_yks"
  if (grade >= 7 && grade <= 8) return "exam_lgs"
  return "exam_yks"
}

export function goalTemplateLabel(t: GoalTemplate): string {
  switch (t) {
    case "school_primary":
      return "Okul hedefi"
    case "exam_lgs":
      return "LGS hazırlık"
    default:
      return "Sınav hedefi"
  }
}

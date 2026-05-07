import type { DailyPlan, PlanTask, PlanTaskSource, PlanTemplatePack } from '@/lib/api'

export type { DailyPlan, PlanTask, PlanTaskSource, PlanTemplatePack }

/** Süre gösterimi: API `planned_minutes`; eski alan `duration_minutes`. */
export function taskMinutes(task: PlanTask): number | undefined {
  const m = task.planned_minutes ?? task.duration_minutes
  return typeof m === 'number' && m > 0 ? m : undefined
}

export function isTeacherAssignedTask(task: PlanTask): boolean {
  return task.source === 'teacher'
}

export function canStudentDeleteTask(task: PlanTask): boolean {
  if (task.source === 'teacher') return false
  if (task.student_editable === false) return false
  return true
}

/**
 * Backend `StudentLearningProfileService` ile aynı kurallar (onboarding / UI ön kontrol).
 * API doğrulaması her zaman sunucuda yapılır.
 */

export const TARGET_GENEL = "GENEL"

export type GoalTemplate = "school_primary" | "exam_lgs" | "exam_yks"

export type EducationPhase =
  | "graduate"
  | "ms_lower"
  | "ms_upper"
  | "hs_early"
  | "hs_senior"
  | "unknown"

export type GoalUserLike = {
  grade?: number | string | null
  target_exam?: string | null
  exam_goal?: string | null
}

export function normalizedIntGrade(user: GoalUserLike | null | undefined): number | null {
  if (user?.grade === undefined || user?.grade === null || user.grade === "") return null
  const g = typeof user.grade === "number" ? user.grade : parseInt(String(user.grade), 10)
  return Number.isFinite(g) ? g : null
}

export function isGraduateGrade(grade: number | null): boolean {
  return grade === 0
}

export function resolveEducationPhase(user: GoalUserLike | null | undefined): EducationPhase {
  const g = normalizedIntGrade(user ?? undefined)
  if (g === null) return "unknown"
  if (isGraduateGrade(g)) return "graduate"
  if (g <= 6) return "ms_lower"
  if (g <= 8) return "ms_upper"
  if (g <= 10) return "hs_early"
  return "hs_senior"
}

export function resolveGoalTemplateFromUser(user: GoalUserLike | null | undefined): GoalTemplate {
  if (!user) return "exam_yks"
  const grade = normalizedIntGrade(user)
  const exam = String(user.target_exam ?? user.exam_goal ?? "")
    .trim()
    .toUpperCase()

  if (grade !== null && isGraduateGrade(grade)) {
    return "exam_yks"
  }

  if (exam === TARGET_GENEL) {
    return "school_primary"
  }

  if (grade !== null && grade >= 5 && grade <= 6) {
    return "school_primary"
  }

  if (exam === "LGS" && grade !== null && grade >= 7 && grade <= 8) {
    return "exam_lgs"
  }

  if (grade !== null && grade >= 7 && grade <= 8) {
    return "exam_lgs"
  }

  if (exam === "TYT" || exam === "AYT" || exam === "TYT-AYT" || exam === "KPSS") {
    return "exam_yks"
  }

  if (grade !== null && grade >= 9) {
    return "exam_yks"
  }

  return "exam_yks"
}

export function validateStudentGradeAndTargetExam(
  grade: number | null,
  targetExam: string | null,
): string | null {
  if (grade === null || targetExam === null || targetExam === "") return null
  const exam = targetExam.trim().toUpperCase()

  if (isGraduateGrade(grade)) {
    if (!["TYT", "AYT", "TYT-AYT", "KPSS"].includes(exam)) {
      return "Mezun öğrenciler için TYT, AYT, TYT-AYT veya KPSS hedefi seçilmelidir."
    }
    return null
  }

  if (grade < 5 || grade > 12) {
    return "Sınıf 5–12 veya mezun (0) olmalıdır."
  }

  if (grade >= 5 && grade <= 6) {
    if (exam !== TARGET_GENEL) {
      return "5–6. sınıf için yalnızca okul odaklı (GENEL) hedef seçilebilir."
    }
    return null
  }

  if (grade === 7 || grade === 8) {
    if (exam !== "LGS") {
      return "7–8. sınıf için hedef sınav LGS olmalıdır."
    }
    return null
  }

  if (grade >= 9 && grade <= 12) {
    if (!["TYT", "AYT", "TYT-AYT", "KPSS"].includes(exam)) {
      return "9–12. sınıf için TYT, AYT, TYT-AYT veya KPSS seçilmelidir."
    }
    return null
  }

  return null
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

export type CurriculumBucket = "school" | "exam";

export function isSchoolExamType(examType: string | undefined): boolean {
  const e = (examType ?? "all").trim().toLowerCase();
  return e === "" || e === "all" || e === "genel";
}

export function partitionCurriculumSubjects<T extends { exam_type?: string }>(subjects: T[]): { school: T[]; exam: T[] } {
  const school: T[] = [];
  const exam: T[] = [];
  for (const s of subjects) {
    if (isSchoolExamType(s.exam_type)) school.push(s);
    else exam.push(s);
  }
  return { school, exam };
}

export function examSubjectMatchesChip(examType: string | undefined, chip: string): boolean {
  if (!chip || chip === "ALL") return true;
  const e = (examType ?? "").toUpperCase();
  if (chip === "TYT") return e.includes("TYT");
  if (chip === "AYT") return e.includes("AYT");
  if (chip === "LGS") return e.includes("LGS");
  if (chip === "KPSS") return e.includes("KPSS");
  return e.includes(chip.toUpperCase());
}

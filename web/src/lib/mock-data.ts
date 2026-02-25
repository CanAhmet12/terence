export const mockUser = {
  id: 1,
  name: "Örnek Öğrenci",
  email: "ogrenci@test.com",
  role: "student",
  profile_photo_url: undefined,
};

export const mockTeacherUser = {
  id: 2,
  name: "Örnek Öğretmen",
  email: "ogretmen@test.com",
  role: "teacher",
  teacher_status: "approved",
};

export const mockGoals = {
  targetExam: "TYT-AYT",
  targetSchool: "İstanbul Üniversitesi",
  targetDepartment: "Hukuk",
  baseScore: 425,
  requiredNetTYT: 75,
  requiredNetAYT: 60,
  currentNetTYT: 42,
  daysRemaining: 165,
  netPer5Days: 1,
  gap: 33,
};

export const mockTasks = [
  { id: 1, text: "M.8.1.1 Üslü İfadeler - 10 soru", done: true },
  { id: 2, text: "Fizik Hareket - Video izle", done: true },
  { id: 3, text: "TYT Deneme - 40 soru", done: false },
  { id: 4, text: "M.8.1.2 Tekrar - 5 soru", done: false },
];

export const mockWeeklyNets = [42, 45, 43, 48, 47, 49, 52];
export const mockStudyTimeToday = "2s 34dk";

export const mockCategories = [
  { id: 1, name: "Matematik", slug: "matematik", unitCount: 12, progress: 65 },
  { id: 2, name: "Fizik", slug: "fizik", unitCount: 8, progress: 40 },
  { id: 3, name: "Türkçe", slug: "turkce", unitCount: 10, progress: 80 },
];

export const mockExams = [
  { id: 1, name: "TYT Deneme 1", type: "TYT", questionCount: 120, duration: 165, completed: true, score: 42, rank: 12500 },
  { id: 2, name: "AYT Deneme 1", type: "AYT", questionCount: 80, duration: 180, completed: false },
];

// Konu analiz raporu - web.MD: Hangi kazanımda kaç yanlış, %kaç eksik, hangi kazanım netini düşürüyor
export const mockKonuAnaliz = [
  { kod: "M.8.1.1", konu: "Üslü İfadeler", dogru: 6, yanlis: 4, bos: 0, yuzde: 60 },
  { kod: "T.9.2.1", konu: "Paragraf Yorumu", dogru: 8, yanlis: 2, bos: 0, yuzde: 80 },
  { kod: "F.9.1.1", konu: "Hareket", dogru: 4, yanlis: 5, bos: 1, yuzde: 40 },
];

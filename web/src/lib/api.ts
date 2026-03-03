const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type FetchOptions = RequestInit & {
  token?: string | null;
  rawBody?: boolean;
};

async function fetchApi<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, rawBody, ...init } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (!rawBody) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data?.error;
    const msg =
      data?.message ||
      (err && typeof err === "object" && "message" in err ? (err as { message: string }).message : null) ||
      (typeof err === "string" ? err : null) ||
      data?.code ||
      res.statusText;
    throw new Error(typeof msg === "string" ? msg : "İstek başarısız");
  }
  return data as T;
}

type AuthResponse = {
  success?: boolean;
  user: User;
  token: string | { access_token: string };
};

export const api = {
  // ─── KİMLİK DOĞRULAMA ──────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const res = await fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const token = typeof res.token === "string" ? res.token : res.token?.access_token;
    return { user: res.user, token };
  },
  async register(data: RegisterInput) {
    return fetchApi<{ user?: User; message?: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async logout(token: string) {
    return fetchApi("/auth/logout", { method: "POST", token });
  },
  async refresh(token: string) {
    return fetchApi<{ token: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
  async forgotPassword(email: string) {
    return fetchApi<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }) {
    return fetchApi<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async verifyEmail(data: { email: string; code: string }) {
    return fetchApi<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async resendVerification(email: string) {
    return fetchApi<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // ─── KULLANICI PROFİLİ ──────────────────────────────────────────────────────
  async getProfile(token: string) {
    return fetchApi<User>("/user", { token });
  },
  async updateProfile(token: string, data: Partial<User> & { phone?: string }) {
    return fetchApi<User>("/user", {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },
  async changePassword(token: string, data: { current_password: string; password: string; password_confirmation: string }) {
    return fetchApi<{ message: string }>("/user/change-password", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },
  async uploadProfilePhoto(token: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/files/upload-shared`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Yükleme başarısız");
    return data as { url: string };
  },
  async updateNotificationPreferences(token: string, prefs: NotificationPreferences) {
    return fetchApi<{ message: string }>("/user/notification-preferences", {
      method: "PUT",
      token,
      body: JSON.stringify(prefs),
    });
  },

  // ─── HEDEF ─────────────────────────────────────────────────────────────────
  async updateGoal(token: string, data: GoalInput) {
    return fetchApi<User>("/user/goal", {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },
  async getGoalAnalysis(token: string) {
    return fetchApi<GoalAnalysis>("/user/goal-analysis", { token });
  },

  // ─── İSTATİSTİKLER ─────────────────────────────────────────────────────────
  async getStatistics(token: string) {
    return fetchApi<StudentStatistics>("/user/statistics", { token });
  },
  async logActivity(token: string, data: { type: string; duration_seconds?: number; reference_id?: number; reference_type?: string }) {
    return fetchApi<{ message: string }>("/user/activity", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  // ─── BİLDİRİMLER ───────────────────────────────────────────────────────────
  async getNotifications(token: string, params?: { per_page?: number; page?: number }) {
    const q = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return fetchApi<PaginatedResponse<Notification>>(`/notifications${q}`, { token });
  },
  async markNotificationRead(token: string, id: number) {
    return fetchApi<{ message: string }>(`/notifications/${id}/read`, {
      method: "POST",
      token,
    });
  },
  async markAllNotificationsRead(token: string) {
    return fetchApi<{ message: string }>("/notifications/read-all", {
      method: "POST",
      token,
    });
  },

  // ─── GÜNLÜK GÖREVLER ───────────────────────────────────────────────────────
  async getDailyTasks(token: string) {
    return fetchApi<DailyTask[]>("/daily-tasks", { token });
  },
  async completeDailyTask(token: string, taskId: number) {
    return fetchApi<{ message: string }>(`/daily-tasks/${taskId}/complete`, {
      method: "POST",
      token,
    });
  },

  // ─── İÇERİK SİSTEMİ ────────────────────────────────────────────────────────
  async getCourses(params?: Record<string, string>) {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi<PaginatedResponse<Course>>(`/courses${q}`);
  },
  async getCourse(slug: string) {
    return fetchApi<Course>(`/courses/${slug}`);
  },
  async getCourseUnits(slug: string, token?: string) {
    return fetchApi<Unit[]>(`/courses/${slug}/units`, { token });
  },
  async getTopicContent(topicId: number, token?: string) {
    return fetchApi<ContentItem[]>(`/topics/${topicId}/content`, { token });
  },
  async updateProgress(token: string, data: { topic_id: number; status: "not_started" | "in_progress" | "completed"; watched_seconds?: number }) {
    return fetchApi<{ message: string }>("/progress/update", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  // ─── SORU SİSTEMİ ──────────────────────────────────────────────────────────
  async getQuestions(token: string, params: { topic_id?: number; difficulty?: string; kazanim_code?: string; per_page?: number }) {
    const q = "?" + new URLSearchParams(params as Record<string, string>).toString();
    return fetchApi<PaginatedResponse<Question>>(`/questions${q}`, { token });
  },
  async answerQuestion(token: string, data: { question_id: number; selected_option: string; time_spent_seconds: number; exam_session_id?: number }) {
    return fetchApi<AnswerResult>("/questions/answer", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },
  async getSimilarQuestions(token: string, questionId: number) {
    return fetchApi<Question[]>(`/questions/similar/${questionId}`, { token });
  },

  // ─── DENEME SİSTEMİ ────────────────────────────────────────────────────────
  async getExams(token: string, params?: Record<string, string>) {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi<PaginatedResponse<Exam>>(`/exams${q}`, { token });
  },
  async startExamSession(token: string, examId: number) {
    return fetchApi<ExamSession>("/exam-sessions", {
      method: "POST",
      token,
      body: JSON.stringify({ exam_id: examId }),
    });
  },
  async getExamSessionQuestions(token: string, sessionId: number) {
    return fetchApi<ExamQuestion[]>(`/exam-sessions/${sessionId}/questions`, { token });
  },
  async answerExamQuestion(token: string, sessionId: number, data: { question_id: number; selected_option: string; time_spent_seconds?: number }) {
    return fetchApi<{ message: string }>(`/exam-sessions/${sessionId}/answer`, {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },
  async finishExamSession(token: string, sessionId: number, payload?: { answers?: Record<number, string> }) {
    return fetchApi<ExamFinishResult>(`/exam-sessions/${sessionId}/finish`, {
      method: "POST",
      token,
      body: JSON.stringify(payload ?? {}),
    });
  },
  async getExamRankings(token: string, examId: number) {
    return fetchApi<Ranking[]>(`/exams/${examId}/rankings`, { token });
  },

  // ─── ÖĞRETMEN ──────────────────────────────────────────────────────────────
  async getTeacherStudents(token: string) {
    return fetchApi<User[]>("/teacher/students", { token });
  },
  async getTeacherLessons(token: string) {
    return fetchApi<TeacherLesson[]>("/teacher/lessons", { token });
  },
  async createTeacherLesson(token: string, data: CreateLessonPayload) {
    return fetchApi<TeacherLesson>("/teacher/lessons", { method: "POST", token, body: JSON.stringify(data) });
  },
  async getTeacherReservations(token: string) {
    return fetchApi<Reservation[]>("/teacher/reservations", { token });
  },
  async updateReservation(token: string, id: number, status: "confirmed" | "cancelled") {
    return fetchApi<Reservation>(`/teacher/reservations/${id}`, { method: "PATCH", token, body: JSON.stringify({ status }) });
  },
  async getTeacherStatistics(token: string) {
    return fetchApi<TeacherStatistics>("/teacher/statistics", { token });
  },
  async getTeacherAssignments(token: string) {
    return fetchApi<Assignment[]>("/teacher/assignments", { token });
  },
  async createAssignment(token: string, data: CreateAssignmentPayload) {
    return fetchApi<Assignment>("/teacher/assignments", { method: "POST", token, body: JSON.stringify(data) });
  },
  async getTeacherMessages(token: string) {
    return fetchApi<TeacherMessage[]>("/teacher/messages", { token });
  },
  async sendMessage(token: string, data: SendMessagePayload) {
    return fetchApi<TeacherMessage>("/teacher/messages", { method: "POST", token, body: JSON.stringify(data) });
  },
  async uploadContent(token: string, data: FormData) {
    return fetchApi<{ id: number; url: string; title: string }>("/teacher/content", {
      method: "POST",
      token,
      body: data,
      rawBody: true,
    });
  },
  async getTeacherClasses(token: string) {
    return fetchApi<TeacherClass[]>("/teacher/classes", { token });
  },

  // ─── VELİ ──────────────────────────────────────────────────────────────────
  async getChildSummary(token: string) {
    return fetchApi<ChildSummary>("/parent/child-summary", { token });
  },
  async getChildReport(token: string) {
    return fetchApi<ChildReport>("/parent/child-report", { token });
  },

  // ─── GENEL ─────────────────────────────────────────────────────────────────
  async getCategories() {
    return fetchApi<{ data: Category[] }>("/categories");
  },
  async getTeachers(params?: Record<string, string>) {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi<{ data: Teacher[] }>(`/teachers${q}`);
  },
  async contact(data: { name: string; email: string; konu: string; mesaj: string }) {
    return fetchApi<{ message?: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ─── ÖDEME / ABONELİK ──────────────────────────────────────────────────────
  async createPayment(token: string, data: CreatePaymentPayload) {
    return fetchApi<PaymentResponse>("/payments/create", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },
  async getSubscription(token: string) {
    return fetchApi<Subscription>("/user/subscription", { token });
  },
  async cancelSubscription(token: string) {
    return fetchApi<{ message: string }>("/user/subscription/cancel", { method: "POST", token });
  },
  async getInvoices(token: string) {
    return fetchApi<Invoice[]>("/user/invoices", { token });
  },

  // ─── PUSH BİLDİRİM ─────────────────────────────────────────────────────────
  async registerPushToken(token: string, push_token: string, platform: "web" | "ios" | "android") {
    return fetchApi<{ message: string }>("/notifications/register-token", {
      method: "POST",
      token,
      body: JSON.stringify({ push_token, platform }),
    });
  },

  // ─── CANLI DERS ─────────────────────────────────────────────────────────────
  async startVideoRoom(token: string, lessonId: number) {
    return fetchApi<VideoRoom>(`/video-call/start/${lessonId}`, { method: "POST", token });
  },
  async getVideoRoom(token: string, lessonId: number) {
    return fetchApi<VideoRoom>(`/video-call/room/${lessonId}`, { token });
  },
  async endVideoRoom(token: string, roomId: string) {
    return fetchApi<{ message: string }>(`/video-call/end/${roomId}`, { method: "POST", token });
  },
  async getStudentUpcomingLessons(token: string) {
    return fetchApi<TeacherLesson[]>("/student/upcoming-lessons", { token });
  },

  // ─── PLAN & GÖREV ────────────────────────────────────────────────────────────
  async getDailyPlan(token: string, date?: string) {
    const q = date ? `?date=${date}` : "";
    return fetchApi<DailyPlan>(`/student/daily-plan${q}`, { token });
  },
  async completeTask(token: string, taskId: number) {
    return fetchApi<{ message: string; xp_earned: number }>(`/student/tasks/${taskId}/complete`, {
      method: "POST",
      token,
    });
  },
  async addCustomTask(token: string, text: string) {
    return fetchApi<PlanTask>("/student/tasks", {
      method: "POST",
      token,
      body: JSON.stringify({ text }),
    });
  },

  // ─── ROZET & SIRALAMA ────────────────────────────────────────────────────────
  async getBadges(token: string) {
    return fetchApi<BadgeData>("/student/badges", { token });
  },
  async getLeaderboard(token: string, period?: "weekly" | "monthly") {
    const q = period ? `?period=${period}` : "";
    return fetchApi<LeaderboardEntry[]>(`/student/leaderboard${q}`, { token });
  },

  // ─── VELİ BİLDİRİM TERCİHLERİ ───────────────────────────────────────────────
  async getParentNotificationSettings(token: string) {
    return fetchApi<ParentNotificationSettings>("/parent/notification-settings", { token });
  },
  async updateParentNotificationSettings(token: string, data: Partial<ParentNotificationSettings>) {
    return fetchApi<ParentNotificationSettings>("/parent/notification-settings", {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },
};

// ─── TİP TANIMLAMALARI ───────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin" | "parent" | string;
  profile_photo_url?: string;
  phone?: string;
  teacher_status?: string;
  subscription_plan?: "free" | "bronze" | "plus" | "pro";
  subscription_expires_at?: string;
  email_verified_at?: string;
  goal?: GoalInput;
  level?: number;
  level_progress?: number;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: "student" | "teacher" | "parent";
  phone?: string;
  child_email?: string;
}

export interface GoalInput {
  exam_type?: "TYT" | "AYT" | "LGS" | "KPSS";
  target_school?: string;
  target_department?: string;
  target_net?: number;
  current_net?: number;
  exam_date?: string;
}

export interface GoalAnalysis {
  target_net: number;
  current_net: number;
  days_remaining: number;
  weekly_net_needed: number;
  risk_level: "green" | "yellow" | "red";
  predicted_net: number;
}

export interface StudentStatistics {
  total_questions_answered: number;
  correct_count: number;
  wrong_count: number;
  net_score: number;
  study_time_today_seconds: number;
  study_time_week_seconds: number;
  weekly_nets: number[];
  streak_days: number;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface DailyTask {
  id: number;
  task_type: string;
  title: string;
  description?: string;
  reference_id?: number;
  reference_type?: string;
  is_done: boolean;
  due_date: string;
}

export interface NotificationPreferences {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  push_notifications?: boolean;
  risk_alerts?: boolean;
  daily_reminders?: boolean;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  class_level?: string;
  exam_type?: string;
  category_id?: number;
  is_free?: boolean;
  order?: number;
  units_count?: number;
  progress_percent?: number;
}

export interface Unit {
  id: number;
  course_id: number;
  title: string;
  order: number;
  topics: Topic[];
}

export interface Topic {
  id: number;
  unit_id: number;
  title: string;
  kazanim_code?: string;
  kazanim_desc?: string;
  order: number;
  progress?: "not_started" | "in_progress" | "completed";
}

export interface ContentItem {
  id: number;
  topic_id: number;
  type: "video" | "pdf" | "quiz";
  title: string;
  url?: string;
  duration_seconds?: number;
  order: number;
  is_free: boolean;
  difficulty?: "easy" | "medium" | "hard";
}

export interface Question {
  id: number;
  topic_id?: number;
  question_text: string;
  question_image_url?: string;
  type?: "classic" | "new_gen" | "paragraph";
  difficulty?: "easy" | "medium" | "hard";
  kazanim_code?: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  option_letter: string;
  option_text: string;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_option: string;
  explanation?: string;
  kazanim_code?: string;
  similar_questions_count?: number;
}

export interface Exam {
  id: number;
  title: string;
  exam_type?: string;
  duration_minutes: number;
  is_national?: boolean;
  question_count?: number;
  participant_count?: number;
  created_at?: string;
  // Frontend için ek alanlar (API veya mock)
  is_completed?: boolean;
  user_score?: number;
  rank?: number;
  is_free?: boolean;
  available_at?: string | null;
  description?: string;
}

export interface ExamQuestion {
  id: number;
  order: number;
  question_text: string;
  question_image_url?: string;
  type?: "classic" | "new_gen" | "paragraph";
  difficulty?: "easy" | "medium" | "hard";
  kazanim_code?: string;
  options: QuestionOption[];
}

export interface ExamSession {
  session_id: number;
  exam_id: number;
  user_id?: number;
  started_at?: string;
  finished_at?: string;
}

export interface KonuAnaliz {
  kazanim_code: string;
  topic_name: string;
  correct: number;
  wrong: number;
  empty: number;
  success_percent: number;
}

export interface ExamFinishResult {
  score: number;
  rank?: number;
  konu_analiz?: KonuAnaliz[];
}

export interface ExamResult {
  session_id: number;
  score: number;
  net: number;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  rank_turkey?: number;
  rank_percent?: number;
  konu_analiz?: KonuAnaliz[];
}

export interface Ranking {
  rank: number;
  user_id: number;
  user_name: string;
  net: number;
}

export interface Reservation {
  id: number;
  student_id: number;
  student_name: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  subject?: string;
}

export interface TeacherLesson {
  id: number;
  title: string;
  class_name?: string;
  scheduled_at: string;
  duration_minutes: number;
  is_recurring: boolean;
  meeting_url?: string;
  status: "upcoming" | "live" | "finished";
}

export interface CreateLessonPayload {
  title?: string;
  class_name?: string;
  scheduled_at: string;
  duration_minutes: number;
  is_recurring: boolean;
}

export interface TeacherClass {
  id: number;
  name: string;
  student_count: number;
  avg_net?: number;
  risk_level?: "green" | "yellow" | "red";
  students?: TeacherStudent[];
}

export interface TeacherStudent {
  id: number;
  name: string;
  email: string;
  net_score?: number;
  risk_level?: "green" | "yellow" | "red";
  last_active_at?: string;
  tasks_completed_today?: number;
  study_time_today_seconds?: number;
}

export interface Assignment {
  id: number;
  title: string;
  class_name?: string;
  subject?: string;
  question_count?: number;
  difficulty?: string;
  due_date?: string;
  is_required: boolean;
  message?: string;
  created_at?: string;
  completed_count?: number;
  total_count?: number;
}

export interface CreateAssignmentPayload {
  class_name: string;
  subject: string;
  topic?: string;
  kazanim_code?: string;
  difficulty: string;
  question_count: number;
  due_date: string;
  is_required: boolean;
  message?: string;
}

export interface TeacherMessage {
  id: number;
  recipient_type: "class" | "student";
  recipient_name: string;
  content: string;
  created_at: string;
}

export interface SendMessagePayload {
  recipient_type: "class" | "student";
  recipient_id: string;
  content: string;
  send_sms?: boolean;
}

export interface TeacherStatistics {
  total_students: number;
  active_lessons: number;
  total_reservations: number;
  average_success_rate: number;
}

export interface ChildSummary {
  child: User;
  net_today: number;
  study_time_today_seconds: number;
  tasks_done_today: number;
  tasks_total_today: number;
  risk_level: "green" | "yellow" | "red";
  last_active_at: string;
}

export interface ChildReport {
  child: User;
  weekly_nets: number[];
  subject_analysis: { subject: string; correct: number; wrong: number; net: number }[];
  recent_exams: Exam[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Teacher {
  id: number;
  user_id: number;
  user?: User;
  bio?: string;
  price_hour?: number;
  rating_avg?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ─── ÖDEME TİPLERİ ───────────────────────────────────────────────────────────
export interface CreatePaymentPayload {
  plan: "bronze" | "plus" | "pro";
  billing_period: "monthly" | "yearly";
  success_url: string;
  fail_url: string;
}

export interface PaymentResponse {
  iframe_token: string;
  order_id: string;
}

export interface Subscription {
  plan: "free" | "bronze" | "plus" | "pro";
  status: "active" | "cancelled" | "expired";
  expires_at: string;
  billing_period: "monthly" | "yearly";
  next_billing_date?: string;
  cancel_at_period_end?: boolean;
}

export interface Invoice {
  id: number;
  amount: number;
  plan: string;
  status: "paid" | "pending" | "failed";
  created_at: string;
  pdf_url?: string;
}

// ─── CANLI DERS TİPLERİ ──────────────────────────────────────────────────────
export interface VideoRoom {
  room_id: string;
  room_url: string;
  lesson_id: number;
  token?: string;
  expires_at?: string;
}

// ─── PLAN & GÖREV TİPLERİ ────────────────────────────────────────────────────
export interface PlanTask {
  id: number;
  text: string;
  type: "question" | "video" | "exam" | "custom";
  subject?: string;
  kazanim_code?: string;
  is_done: boolean;
  xp: number;
}

export interface DailyPlan {
  date: string;
  tasks: PlanTask[];
  completed_count: number;
  total_count: number;
  weekly_summary: {
    completed: number;
    total: number;
    study_minutes: number;
    questions_solved: number;
  };
  risk_message?: string;
}

// ─── ROZET & SIRALAMA TİPLERİ ────────────────────────────────────────────────
export interface Badge {
  id: number;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
  earned_at?: string;
  xp_reward: number;
}

export interface BadgeData {
  badges: Badge[];
  level: number;
  xp: number;
  xp_next_level: number;
  weekly_champion?: { name: string; study_minutes: number; net_increase: number } | null;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  study_minutes: number;
  net_increase: number;
  is_current_user: boolean;
  avatar_url?: string;
}

// ─── VELİ BİLDİRİM TİPLERİ ──────────────────────────────────────────────────
export interface ParentNotificationSettings {
  sms_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  inactivity_alert: boolean;
  inactivity_days: number;
  risk_alert: boolean;
  exam_results: boolean;
  live_lesson_reminder: boolean;
  homework_reminder: boolean;
  phone?: string;
  email?: string;
}


// ─── API BASE ───────────────────────────────────────────────────────────────
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "https://terenceegitim.com/api").replace(
    /\/$/,
    ""
  );

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
    const msg =
      data?.message ||
      data?.error?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      data?.code ||
      res.statusText ||
      "İstek başarısız";
    throw new Error(typeof msg === "string" ? msg : "İstek başarısız");
  }
  return data as T;
}

// ─── AUTH RESPONSE ───────────────────────────────────────────────────────────
type AuthResponse = {
  success?: boolean;
  user: User;
  token: { access_token: string; token_type: string; expires_in: number };
  verification_required?: boolean;
};

// ─── API ─────────────────────────────────────────────────────────────────────
export const api = {

  // ── Auth ───────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const res = await fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return { user: res.user, token: res.token.access_token };
  },

  async register(data: RegisterInput) {
    const res = await fetchApi<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { user: res.user, token: res.token.access_token, verification_required: res.verification_required };
  },

  async logout(token: string) {
    return fetchApi<{ success: boolean }>("/auth/logout", {
      method: "POST",
      token,
    });
  },

  async refresh(token: string) {
    return fetchApi<{ token: { access_token: string } }>("/auth/refresh", {
      method: "POST",
      token,
    });
  },

  async getMe(token: string) {
    const res = await fetchApi<{ success: boolean; user: User }>("/auth/me", { token });
    return res.user;
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

  async verifyEmail(data: { email: string; verification_code: string }) {
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

  // ── Profil ─────────────────────────────────────────────────────────────────
  async updateProfile(token: string, data: Partial<User> & { phone?: string; bio?: string; daily_reminder_time?: string }) {
    const res = await fetchApi<{ success: boolean; user: User }>("/user/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
    });
    return res.user;
  },

  async changePassword(token: string, data: { current_password: string; password: string; password_confirmation: string }) {
    return fetchApi<{ success: boolean; message: string }>("/user/change-password", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  async uploadProfilePhoto(token: string, file: File) {
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch(`${API_BASE}/user/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Yükleme başarısız");
    return data as { success: boolean; url: string };
  },

  async updateGoal(token: string, data: GoalInput) {
    const res = await fetchApi<{ success: boolean; goal: GoalInput }>("/user/goal", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
    return res.goal;
  },

  // ── Kurslar ────────────────────────────────────────────────────────────────
  async getCourses(token?: string | null, params?: Record<string, string>) {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetchApi<{ success: boolean; data: Course[] }>(`/courses${q}`, { token });
    return res.data;
  },

  async getCourse(id: number, token?: string | null) {
    const res = await fetchApi<{ success: boolean; data: Course }>(`/courses/${id}`, { token });
    return res.data;
  },

  async enrollCourse(token: string, courseId: number) {
    return fetchApi<{ success: boolean; message: string }>(`/courses/${courseId}/enroll`, {
      method: "POST",
      token,
    });
  },

  async updateProgress(token: string, data: { content_item_id?: number; topic_id?: number; status: "in_progress" | "completed"; watch_seconds?: number; marked_understood?: boolean; needs_repeat?: boolean }) {
    return fetchApi<{ success: boolean }>("/progress", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  // ── Soru Bankası ───────────────────────────────────────────────────────────
  async getQuestions(token: string, params?: {
    subject?: string;
    grade?: number;
    exam_type?: string;
    difficulty?: string;
    topic_id?: number;
    kazanim_code?: string;
    q?: string;
    per_page?: number;
    page?: number;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") query.set(k, String(v));
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    return fetchApi<{
      success: boolean;
      data: Question[];
      meta: { current_page: number; last_page: number; total: number; per_page: number };
    }>(`/questions${qs}`, { token });
  },

  async answerQuestion(token: string, data: { question_id: number; selected_option: string | null; time_spent_seconds?: number }) {
    return fetchApi<AnswerResult>("/questions/answer", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  async getSimilarQuestions(token: string, questionId: number) {
    return fetchApi<{ success: boolean; data: Question[] }>(`/questions/similar?question_id=${questionId}`, { token });
  },

  async getWeakAchievements(token: string) {
    const res = await fetchApi<{ success: boolean; data: WeakAchievement[] }>("/questions/weak", { token });
    return res.data;
  },

  async getKazanimlar(token: string, params?: { subject?: string; grade?: number; exam_type?: string }) {
    const query = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, String(v)); });
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await fetchApi<{ success: boolean; data: Kazanim[] }>(`/kazanimlar${qs}`, { token });
    return res.data;
  },

  // ── Deneme Sınavı ──────────────────────────────────────────────────────────
  async startExam(token: string, data: { exam_type: string; title?: string; duration_minutes?: number; question_count?: number; subject?: string }) {
    return fetchApi<StartExamResponse>("/exams/start", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  async answerExamQuestion(token: string, sessionId: number, data: { question_id: number; selected_option?: string | null; is_flagged?: boolean; time_spent_seconds?: number }) {
    return fetchApi<{ success: boolean }>(`/exams/${sessionId}/answer`, {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  async finishExam(token: string, sessionId: number) {
    return fetchApi<ExamFinishResult>(`/exams/${sessionId}/finish`, {
      method: "POST",
      token,
    });
  },

  async getExamResult(token: string, sessionId: number) {
    return fetchApi<{ success: boolean; result: ExamSession }>(`/exams/${sessionId}/result`, { token });
  },

  async getExamHistory(token: string) {
    const res = await fetchApi<{ success: boolean; data: ExamSession[] }>("/exams/history", { token });
    return res.data;
  },

  // ── Günlük Plan ────────────────────────────────────────────────────────────
  async getTodayPlan(token: string) {
    const res = await fetchApi<{ success: boolean; plan: DailyPlan }>("/plan/today", { token });
    return res.plan;
  },

  async getWeeklyPlans(token: string, from?: string, to?: string) {
    const q = from ? `?from=${from}&to=${to ?? ""}` : "";
    const res = await fetchApi<{ success: boolean; data: DailyPlan[] }>(`/plan${q}`, { token });
    return res.data;
  },

  async getPlanStats(token: string) {
    return fetchApi<PlanStats>("/plan/stats", { token });
  },

  async addPlanTask(token: string, data: {
    title: string;
    type?: string;
    subject?: string;
    kazanim_code?: string;
    target_count?: number;
    planned_minutes?: number;
    priority?: "low" | "normal" | "high";
    plan_date?: string;
  }) {
    return fetchApi<{ success: boolean; task: PlanTask }>("/plan/tasks", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  async addCustomTask(token: string, text: string) {
    return fetchApi<{ success: boolean; task: PlanTask }>("/plan/tasks", {
      method: "POST",
      token,
      body: JSON.stringify({ title: text, type: "custom" }),
    });
  },

  async completeTask(token: string, taskId: number) {
    return fetchApi<{ success: boolean; task: PlanTask }>(`/plan/tasks/${taskId}/complete`, {
      method: "PATCH",
      token,
    });
  },

  async deleteTask(token: string, taskId: number) {
    return fetchApi<{ success: boolean }>(`/plan/tasks/${taskId}`, {
      method: "DELETE",
      token,
    });
  },

  async startStudySession(token: string, data?: { subject?: string; plan_task_id?: number }) {
    return fetchApi<{ success: boolean; session_id: number }>("/plan/study-session/start", {
      method: "POST",
      token,
      body: JSON.stringify(data ?? {}),
    });
  },

  async endStudySession(token: string, sessionId: number) {
    return fetchApi<{ success: boolean; duration_seconds: number }>(`/plan/study-session/${sessionId}/end`, {
      method: "POST",
      token,
    });
  },

  // ── Abonelik / Ödeme ───────────────────────────────────────────────────────
  async getPackages() {
    const res = await fetchApi<{ success: boolean; data: SubscriptionPlan[] }>("/packages");
    return res.data;
  },

  async initiatePayment(token: string, data: { plan_id: number; billing_cycle: "monthly" | "yearly" }) {
    return fetchApi<{ success: boolean; token: string; merchant_oid: string; iframe_url: string }>("/payment/initiate", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  async getSubscriptionStatus(token: string) {
    return fetchApi<{ success: boolean; subscription_plan: string; expires_at: string | null; subscription: Subscription | null }>("/subscription/status", { token });
  },

  // ── Öğretmen ───────────────────────────────────────────────────────────────
  async getTeacherStats(token: string) {
    return fetchApi<{ success: boolean; total_students: number; active_today: number; average_net: number; assignment_count: number }>("/teacher/stats", { token });
  },

  async getTeacherClasses(token: string) {
    const res = await fetchApi<{ success: boolean; data: ClassRoom[] }>("/teacher/classes", { token });
    return res.data;
  },

  async createTeacherClass(token: string, data: { name: string; grade?: number; exam_type?: string }) {
    return fetchApi<{ success: boolean; class: ClassRoom }>("/teacher/classes", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  async getClassStudents(token: string, classId: number) {
    const res = await fetchApi<{ success: boolean; data: User[] }>(`/teacher/classes/${classId}/students`, { token });
    return res.data;
  },

  async getRiskStudents(token: string) {
    const res = await fetchApi<{ success: boolean; data: RiskStudent[] }>("/teacher/students/risk", { token });
    return res.data;
  },

  async getTeacherAssignments(token: string) {
    const res = await fetchApi<{ success: boolean; data: Assignment[] }>("/teacher/assignments", { token });
    return res.data;
  },

  async createAssignment(token: string, data: { title: string; type: string; description?: string; target_count?: number; subject?: string; due_date?: string; class_room_id?: number }) {
    return fetchApi<{ success: boolean; assignment: Assignment }>("/teacher/assignments", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  async getLiveSessions(token: string) {
    const res = await fetchApi<{ success: boolean; data: LiveSession[] }>("/teacher/live-sessions", { token });
    return res.data;
  },

  async createLiveSession(token: string, data: { title: string; class_room_id?: number; scheduled_at?: string; duration_minutes?: number }) {
    return fetchApi<{ success: boolean; session: LiveSession }>("/teacher/live-sessions", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  // getTeacherStudents — eski fonksiyon adı geçerliliği için
  async getTeacherStudents(token: string) {
    return this.getRiskStudents(token);
  },

  // ── Veli ───────────────────────────────────────────────────────────────────
  async getChildren(token: string) {
    const res = await fetchApi<{ success: boolean; data: ChildSummary[] }>("/parent/children", { token });
    return res.data;
  },

  async getChildSummary(token: string, childId?: number) {
    if (childId) {
      const res = await fetchApi<{ success: boolean; data: ChildSummary }>(`/parent/children/${childId}/summary`, { token });
      return res.data;
    }
    const res = await fetchApi<{ success: boolean; data: ChildSummary[] }>("/parent/children", { token });
    return res.data[0] ?? null;
  },

  async linkChild(token: string, invite_code: string) {
    return fetchApi<{ success: boolean; message: string }>("/parent/link", {
      method: "POST",
      token,
      body: JSON.stringify({ invite_code }),
    });
  },

  async generateParentCode(token: string) {
    return fetchApi<{ success: boolean; invite_code: string }>("/student/generate-parent-code", {
      method: "POST",
      token,
    });
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  async getAdminStats(token: string) {
    return fetchApi<AdminStats>("/admin/stats", { token });
  },

  async getAdminUsers(token: string, params?: { search?: string; role?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.page) query.set("page", String(params.page));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return fetchApi<{ success: boolean; data: User[]; meta: { total: number; current_page: number; last_page: number } }>(`/admin/users${qs}`, { token });
  },

  async updateAdminUser(token: string, userId: number, data: Partial<{ name: string; role: string; subscription_plan: string; is_active: boolean }>) {
    return fetchApi<{ success: boolean; user: User }>(`/admin/users/${userId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(data),
    });
  },

  async deleteAdminUser(token: string, userId: number) {
    return fetchApi<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
      method: "DELETE",
      token,
    });
  },

  async toggleAdminUserStatus(token: string, userId: number) {
    return fetchApi<{ success: boolean; is_active: boolean; message: string }>(`/admin/users/${userId}/toggle-status`, {
      method: "POST",
      token,
    });
  },

  async getAdminContent(token: string, params?: { search?: string; type?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.type) query.set("type", params.type);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return fetchApi<{ success: boolean; data: AdminContentItem[]; meta: { total: number } }>(`/admin/content${qs}`, { token });
  },

  async deleteAdminContent(token: string, contentId: number) {
    return fetchApi<{ success: boolean; message: string }>(`/admin/content/${contentId}`, {
      method: "DELETE",
      token,
    });
  },

  async getAdminReports(token: string) {
    return fetchApi<AdminReports>("/admin/reports", { token });
  },

  async getAdminAuditLogs(token: string, params?: { page?: number; per_page?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.per_page) query.set("per_page", String(params.per_page));
    const qs = query.toString() ? `?${query.toString()}` : "";
    return fetchApi<{ success: boolean; data: AuditLog[] }>(`/admin/audit-logs${qs}`, { token });
  },

  async updateAdminSettings(token: string, data: Record<string, unknown>) {
    return fetchApi<{ success: boolean; message: string }>("/admin/settings", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  // ── Bildirimler ────────────────────────────────────────────────────────────
  async getNotifications(token: string, params?: { per_page?: number; page?: number }) {
    const q = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return fetchApi<PaginatedResponse<Notification>>(`/notifications${q}`, { token });
  },
  async markNotificationRead(token: string, id: number) {
    return fetchApi<{ message: string }>(`/notifications/${id}/read`, { method: "POST", token });
  },
  async markAllNotificationsRead(token: string) {
    return fetchApi<{ message: string }>("/notifications/read-all", { method: "POST", token });
  },
  async registerPushToken(token: string, push_token: string, platform: "web" | "ios" | "android") {
    return fetchApi<{ message: string }>("/notifications/register-token", {
      method: "POST", token, body: JSON.stringify({ push_token, platform }),
    });
  },

  // ── Ek eski uyumluluk ────────────────────────────────────────────────────────
  async contact(data: { name: string; email: string; konu: string; mesaj: string }) {
    return fetchApi<{ message?: string }>("/contact", { method: "POST", body: JSON.stringify(data) });
  },

  async getGoalAnalysis(token: string) {
    return fetchApi<GoalAnalysis>("/plan/stats", { token });
  },

  async getStatistics(token: string) {
    const res = await api.getPlanStats(token);
    return res;
  },

  async getBadges(token: string) {
    return fetchApi<BadgeData>("/student/badges", { token });
  },

  async getLeaderboard(token: string, period?: "weekly" | "monthly") {
    const q = period ? `?period=${period}` : "";
    return fetchApi<LeaderboardEntry[]>(`/student/leaderboard${q}`, { token });
  },

  async getCourseUnits(courseId: number | string, token?: string | null) {
    const res = await fetchApi<{ success: boolean; data: Unit[] }>(`/courses/${courseId}`, { token });
    return (res as unknown as { success: boolean; data: { units?: Unit[] } }).data?.units ?? [];
  },

  async getTopicContent(topicId: number, token?: string | null) {
    const res = await fetchApi<{ success: boolean; data: ContentItem[] }>(`/topics/${topicId}/content`, { token });
    return res.data;
  },

  async getStudentUpcomingLessons(token: string) {
    const res = await fetchApi<{ success: boolean; data: LiveSession[] }>("/student/upcoming-lessons", { token });
    return res.data;
  },

  async getVideoRoom(token: string, lessonId: number) {
    return fetchApi<VideoRoom>(`/live-sessions/${lessonId}/join`, { token });
  },

  async getTeacherLessons(token: string) {
    return this.getLiveSessions(token);
  },

  async createTeacherLesson(token: string, data: { title: string; class_room_id?: number; scheduled_at?: string; duration_minutes?: number }) {
    return this.createLiveSession(token, data);
  },

  async getTeachers(params?: Record<string, string>) {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi<{ data: User[] }>(`/admin/users?role=teacher${q.replace("?","&")}`);
  },

  async uploadContent(token: string, data: FormData) {
    const res = await fetch(`${API_BASE}/teacher/content`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: data,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || "Yükleme başarısız");
    return json as { success: boolean; id: number; url: string };
  },

  async getTeacherMessages(token: string) {
    const res = await fetchApi<{ success: boolean; data: TeacherMessage[] }>("/teacher/messages", { token });
    return res.data;
  },

  async sendMessage(token: string, data: { recipient_type: string; recipient_id?: number; recipient_name?: string; content: string; send_push?: boolean; send_sms?: boolean }) {
    return fetchApi<{ success: boolean; message: TeacherMessage }>("/teacher/messages", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },

  async updateNotificationPreferences(token: string, data: Record<string, boolean>) {
    return fetchApi<{ success: boolean }>("/user/notification-preferences", {
      method: "PATCH", token, body: JSON.stringify(data),
    });
  },

  async getParentNotificationSettings(token: string) {
    const res = await fetchApi<{ success: boolean; settings: ParentNotificationSettings }>("/parent/notification-settings", { token });
    return res.settings;
  },

  async updateParentNotificationSettings(token: string, data: Partial<ParentNotificationSettings>) {
    const res = await fetchApi<{ success: boolean; settings: ParentNotificationSettings }>("/parent/notification-settings", {
      method: "PATCH", token, body: JSON.stringify(data),
    });
    return res.settings;
  },

  async getChildReport(token: string) {
    const res = await fetchApi<{ success: boolean; report: ChildReport }>("/parent/child-report", { token });
    return res.report;
  },
};

// ─── TİP TANIMLAMALARI ────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin" | "parent" | string;
  profile_photo_url?: string;
  phone?: string;
  bio?: string;
  teacher_status?: string;
  subscription_plan?: "free" | "bronze" | "plus" | "pro";
  subscription_expires_at?: string;
  email_verified_at?: string;
  last_login_at?: string;
  xp_points?: number;
  level?: number;
  goal?: {
    exam_type?: string;
    grade?: number;
    target_school?: string;
    target_department?: string;
    target_net?: number;
    current_net?: number;
  };
  created_at?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: "student" | "teacher" | "parent";
  phone?: string;
  grade?: number;
}

export interface GoalInput {
  exam_type?: "TYT" | "AYT" | "LGS" | "KPSS" | "TYT-AYT" | "KPSS";
  grade?: number;
  target_school?: string;
  target_department?: string;
  target_net?: number;
  current_net?: number;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  subject?: string;
  exam_type?: string;
  grade?: number;
  level?: "beginner" | "intermediate" | "advanced";
  is_free?: boolean;
  is_enrolled?: boolean;
  completion_percentage?: number;
  progress_percent?: number;
  units_count?: number;
  units?: Unit[];
  created_at?: string;
}

export interface Unit {
  id: number;
  course_id: number;
  title: string;
  sort_order: number;
  topics?: Topic[];
}

export interface Topic {
  id: number;
  unit_id: number;
  title: string;
  sort_order: number;
  kazanim_code?: string;
  kazanim_desc?: string;
  progress?: "not_started" | "in_progress" | "completed";
  content_items?: ContentItem[];
}

export interface ContentItem {
  id: number;
  topic_id: number;
  type: "video" | "pdf" | "quiz" | "text";
  title: string;
  url?: string;
  duration_seconds?: number;
  size_bytes?: number;
  is_free?: boolean;
  progress_status?: "not_started" | "in_progress" | "completed";
  created_at?: string;
}

export interface Question {
  id: number;
  topic_id?: number;
  kazanim_id?: number;
  kazanim_code?: string;
  question_text: string;
  question_image_url?: string;
  type?: "classic" | "new_gen" | "paragraph";
  difficulty?: "easy" | "medium" | "hard";
  subject?: string;
  grade?: number;
  exam_type?: string;
  solution_video_url?: string;
  solution_text?: string;
  options: QuestionOption[];
  user_answer?: QuestionAnswer | null;
  accuracy_rate?: number;
}

export interface QuestionOption {
  id: number;
  question_id?: number;
  option_letter: string;
  option_text: string;
  option_image_url?: string;
  is_correct?: boolean;
}

export interface QuestionAnswer {
  selected_option: string;
  is_correct: boolean;
  answered_at: string;
}

export interface AnswerResult {
  success?: boolean;
  is_correct: boolean;
  correct_option: string;
  explanation?: string;
  solution_video?: string;
  xp_earned?: number;
}

export interface Kazanim {
  id: number;
  kod: string;
  tanim: string;
  subject: string;
  grade?: number;
  unite?: string;
  konu?: string;
  exam_type?: string;
}

export interface WeakAchievement {
  id: number;
  kod: string;
  konu: string;
  subject?: string;
  wrong_count: number;
  total_count: number;
  accuracy_rate: number;
  suggestion?: string;
  video_url?: string;
}

// Deneme sınavı
export interface StartExamResponse {
  success: boolean;
  session: ExamSession;
  questions: ExamQuestion[];
}

export interface ExamSession {
  id: number;
  user_id?: number;
  title: string;
  exam_type: string;
  status: "pending" | "in_progress" | "completed" | "abandoned";
  duration_minutes: number;
  started_at?: string;
  finished_at?: string;
  time_spent_seconds?: number;
  total_questions?: number;
  correct_count?: number;
  wrong_count?: number;
  empty_count?: number;
  net_score?: number;
  subject_breakdown?: Record<string, { correct: number; wrong: number; empty: number; net: number }>;
}

export interface ExamQuestion {
  id: number;
  question_text: string;
  image_url?: string;
  type?: string;
  difficulty?: string;
  subject?: string;
  options: { letter: string; text: string; image?: string }[];
}

export interface ExamFinishResult {
  success: boolean;
  session_id: number;
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  net_score: number;
  subject_breakdown: Record<string, { correct: number; wrong: number; empty: number; net: number }>;
  time_spent_seconds: number;
  xp_earned: number;
}

// Plan
export interface DailyPlan {
  id: number;
  user_id?: number;
  plan_date: string;
  status: "pending" | "active" | "completed" | "partially";
  total_tasks: number;
  completed_tasks: number;
  study_minutes_actual?: number;
  study_minutes_planned?: number;
  tasks?: PlanTask[];
}

export interface PlanTask {
  id: number;
  daily_plan_id?: number;
  title: string;
  type: string;
  subject?: string;
  kazanim_code?: string;
  target_count?: number;
  actual_count?: number;
  planned_minutes?: number;
  is_completed: boolean;
  is_ai_suggested?: boolean;
  priority?: string;
  completed_at?: string;
  sort_order?: number;
}

export interface PlanStats {
  success?: boolean;
  tasks_done_today: number;
  tasks_total_today: number;
  study_time_today_seconds: number;
  study_time_weekly_seconds: number;
  xp_points: number;
  level: number;
  current_net: number;
  target_net: number;
  weekly_nets: number[];
  streak_days?: number;
}

// Abonelik
export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: "bronze" | "plus" | "pro";
  monthly_price: number;
  yearly_price?: number;
  features?: string[];
  is_active?: boolean;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: "pending" | "active" | "cancelled" | "expired";
  billing_cycle: "monthly" | "yearly";
  amount_paid: number;
  starts_at?: string;
  expires_at?: string;
  plan?: SubscriptionPlan;
}

// Öğretmen
export interface ClassRoom {
  id: number;
  teacher_id: number;
  name: string;
  join_code?: string;
  grade?: number;
  exam_type?: string;
  is_active?: boolean;
  students_count?: number;
}

export interface RiskStudent {
  id: number;
  name: string;
  email?: string;
  current_net: number;
  target_net?: number;
  risk_level: "green" | "yellow" | "red";
  last_active_at?: string;
  days_inactive?: number;
  xp_points?: number;
  // eski uyumluluk
  risk?: "green" | "yellow" | "red";
  predicted_net?: number;
  weekly_change?: number;
  weekly_nets?: number[];
  weak_subjects?: { subject: string; accuracy: number }[];
}

export interface Assignment {
  id: number;
  teacher_id?: number;
  class_room_id?: number;
  title: string;
  description?: string;
  type: "question" | "video" | "read";
  target_count?: number;
  subject?: string;
  due_date?: string;
  is_active?: boolean;
  completions_count?: number;
  class_room?: { id: number; name: string };
}

export interface LiveSession {
  id: number;
  teacher_id?: number;
  title: string;
  daily_room_url?: string;
  daily_room_name?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  status: "scheduled" | "live" | "ended";
  class_room?: { id: number; name: string };
}

// Veli
export interface ChildSummary {
  child: {
    id: number;
    name: string;
    email: string;
    grade?: number;
    subscription_plan?: string;
    profile_photo_url?: string;
  };
  net_today: number;
  study_time_today_seconds: number;
  tasks_done_today: number;
  tasks_total_today: number;
  risk_level: "green" | "yellow" | "red";
  last_active_at?: string;
  weekly_nets?: number[];
  weak_subjects?: { subject: string; accuracy: number }[];
}

// Admin
export interface AdminStats {
  success?: boolean;
  total_users: number;
  total_students: number;
  total_teachers: number;
  active_users_today: number;
  total_courses: number;
  total_questions: number;
  total_exams: number;
  monthly_revenue: number;
  active_subscriptions: number;
}

export interface AdminContentItem {
  id: number;
  title: string;
  type: "video" | "pdf" | "quiz" | "text" | "question";
  subject?: string;
  unit?: string;
  created_at?: string;
  size_bytes?: number;
  url?: string;
}

export interface AdminReports {
  success?: boolean;
  weekly_users: { label: string; value: number }[];
  monthly_revenue: { label: string; value: number }[];
  exam_completion_rate: number;
  average_study_time_minutes: number;
  active_users_today?: number;
  top_subjects: { subject: string; count: number }[];
  subscription_conversions: { from: string; to: string; count: number }[];
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action?: string;
  description?: string;
  ip_address?: string;
  created_at: string;
  user?: { id: number; name: string; email: string };
}

// Genel
export interface Notification {
  id: number;
  title: string;
  body?: string;
  message?: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// Parent interfaces
export interface ParentNotificationSettings {
  sms_enabled?: boolean;
  email_enabled?: boolean;
  push_enabled?: boolean;
  inactivity_alert?: boolean;
  inactivity_days?: number;
  risk_alert?: boolean;
  exam_results?: boolean;
  live_lesson_reminder?: boolean;
  homework_reminder?: boolean;
  phone?: string;
  email?: string;
}

export interface ChildReport {
  child: { id: number; name: string; email?: string };
  weekly_nets?: number[];
  current_net?: number;
  target_net?: number;
  study_time_weekly_seconds?: number;
  tasks_done_this_week?: number;
  subject_analysis?: Array<{ subject: string; correct: number; wrong: number; net: number }>;
  recent_exams?: Array<Record<string, unknown>>;
}

// TeacherClass / TeacherStudent
export interface TeacherStudent {  id: number;
  name: string;
  email?: string;
  net_score?: number;
  risk_level?: "green" | "yellow" | "red" | string;
  last_active_at?: string;
  tasks_completed_today?: number;
  study_time_today_seconds?: number;
}

export interface TeacherClass {
  id: number;
  name: string;
  student_count?: number;
  avg_net?: number;
  risk_level?: "green" | "yellow" | "red" | string;
  students?: TeacherStudent[];
}

// TeacherMessage
export interface TeacherMessage {  id: number;
  recipient_type: "class" | "student" | "all" | string;
  recipient_id?: number;
  recipient_name?: string;
  content: string;
  send_push?: boolean;
  send_sms?: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// GoalAnalysis — plan/stats'tan türetilir
export interface GoalAnalysis {
  target_net: number;
  current_net: number;
  days_remaining: number;
  weekly_net_needed: number;
  risk_level: "green" | "yellow" | "red";
  predicted_net: number;
}

// StudentStatistics — eski uyumluluk
export type StudentStatistics = PlanStats;

// VideoRoom
export interface VideoRoom {
  room_url: string;
  room_name?: string;
  token?: string;
}

// TeacherLesson — LiveSession ile aynı
export type TeacherLesson = LiveSession;

export interface Badge {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  emoji?: string;
  earned?: boolean;
  earned_at?: string;
  xp_reward?: number;
}

export interface BadgeData {
  badges: Badge[];
  total_xp?: number;
  xp?: number;
  xp_next_level?: number;
  level: number;
  weekly_champion?: { name: string; study_minutes?: number; net_increase?: number };
}

export interface LeaderboardEntry {
  rank: number;
  user_id?: number;
  name: string;
  xp_points?: number;
  profile_photo_url?: string;
  study_minutes?: number;
  net_increase?: number;
  is_current_user?: boolean;
}

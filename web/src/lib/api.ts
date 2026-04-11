import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken =
          refreshResponse.data?.token?.access_token ||
          refreshResponse.data?.access_token

        if (!newToken) throw new Error('No token in refresh response')

        setAccessToken(newToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }
        return api(originalRequest)
      } catch {
        clearTokens()
        window.location.href = '/giris'
        return Promise.reject(error)
      }
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      toast.error(`Çok fazla istek. ${retryAfter ? `${retryAfter} saniye` : 'Biraz'} bekleyip tekrar deneyin.`)
    }

    if (error.response?.status === 422) {
      const data = error.response.data as Record<string, unknown>
      if (data.errors && typeof data.errors === 'object') {
        const firstError = Object.values(data.errors as Record<string, string[]>)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
          toast.error(firstError[0])
        } else {
          toast.error((data.message as string) || 'Geçersiz veri')
        }
      } else {
        toast.error((data.message as string) || 'Geçersiz veri')
      }
    }

    if (error.response?.status === 403) {
      toast.error('Bu işlem için yetkiniz yok.')
    }

    if (error.response?.status === 500) {
      toast.error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.')
    }

    return Promise.reject(error)
  }
)

// ─── Token Management ───────────────────────────────────────────────────────
// auth-context ile aynı anahtar
const TOKEN_KEY = 'terence_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('terence_user')
}

// ─── Generic Helpers ────────────────────────────────────────────────────────
export async function apiGet<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.get<T>(url, config)
  return response.data
}

export async function apiPost<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.post<T>(url, data, config)
  return response.data
}

export async function apiPut<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.put<T>(url, data, config)
  return response.data
}

export async function apiPatch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.patch<T>(url, data, config)
  return response.data
}

export async function apiDelete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.delete<T>(url, config)
  return response.data
}

// ─── Helper: normalize array response ───────────────────────────────────────
// Backend bazen { data: [...] } bazen direkt [...] döner
function normalizeArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[]
  if (res && typeof res === 'object') {
    const obj = res as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
  }
  return []
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'teacher' | 'parent' | 'admin'
  phone?: string
  profile_photo_url?: string
  avatar?: string
  email_verified_at?: string | null
  grade?: number
  target_exam?: string
  exam_goal?: string
  target_school?: string
  target_department?: string
  target_net?: number
  current_net?: number
  subject?: string
  bio?: string
  subscription_plan?: string
  subscription_expires_at?: string | null
  teacher_status?: string
  xp_points?: number
  level?: number
  streak_days?: number
  exam_date?: string
  daily_reminder_time?: string
  goal?: { exam_type?: string; target_net?: number }
  created_at: string
  updated_at?: string
}

export interface TokenData {
  access_token: string
  token_type: string
  expires_in: number
}

export interface LoginResponse {
  success: boolean
  message: string
  user: User
  token: TokenData
  verification_required?: boolean
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: 'student' | 'teacher' | 'parent'
  phone?: string
  grade?: number
  target_exam?: string
  target_school?: string
  target_department?: string
  target_net?: number
  subject?: string
  bio?: string
  child_email?: string
}

export interface Notification {
  id: number
  title: string
  body: string
  type: string
  is_read: boolean
  data?: Record<string, unknown>
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface Question {
  id: number
  subject?: string
  topic?: string
  kazanim?: string
  difficulty?: string
  question_text: string
  options?: { option_letter: string; option_text: string; is_correct?: boolean }[]
  correct_answer?: string
  explanation?: string
  image_url?: string
}

export interface ExamSession {
  id: number
  exam_type?: string
  status?: string
  score?: number
  total_questions?: number
  correct_count?: number
  wrong_count?: number
  empty_count?: number
  duration_minutes?: number
  started_at?: string
  finished_at?: string
  questions?: Question[]
}

// ─── Curriculum (Müfredat) Interfaces ────────────────────────────────────────

export interface CurriculumContentItem {
  id: number
  type: 'video' | 'pdf' | 'quiz' | 'text'
  title: string
  url?: string
  is_free?: boolean
  duration_seconds?: number
}

export interface CurriculumTopic {
  id: number
  unit_id: number
  title: string
  description?: string
  meb_code?: string
  sort_order: number
  status: 'not_started' | 'in_progress' | 'completed'
  linked_topic_id?: number
  content_items?: CurriculumContentItem[]
}

export interface CurriculumUnit {
  id: number
  subject_id: number
  title: string
  description?: string
  meb_code?: string
  sort_order: number
  topics: CurriculumTopic[]
  total_topics: number
  completed_topics: number
  progress_percent: number
}

export interface CurriculumSubject {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  grade: string
  exam_type: string
  sort_order: number
  total_topics?: number
  completed_topics?: number
  progress_percent?: number
  units?: CurriculumUnit[]
}

export interface PlanTask {
  id: number
  title?: string
  subject?: string
  topic?: string
  duration_minutes?: number
  is_completed?: boolean
  completed?: boolean
  order?: number
  type?: string
  notes?: string
}

export interface StudyPlan {
  id?: number
  date?: string
  tasks?: PlanTask[]
  total_tasks?: number
  completed_tasks?: number
}

export interface Badge {
  id: number
  name: string
  description?: string
  icon?: string
  earned?: boolean
  earned_at?: string
  xp_reward?: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: number
  name: string
  avatar?: string
  profile_photo_url?: string
  xp_points?: number
  level?: number
  streak_days?: number
  net_increase?: number
  study_minutes?: number
  is_me?: boolean
  is_current_user?: boolean
  grade?: number
  exam_type?: string
}

export interface TeacherClass {
  id: number
  name: string
  subject?: string
  student_count?: number
  created_at?: string
}

export type ClassRoom = TeacherClass

export interface ParentNotificationSettings {
  email_notifications?: boolean
  push_notifications?: boolean
  sms_notifications?: boolean
  inactivity_alert?: boolean
  low_performance_alert?: boolean
  exam_result_notification?: boolean
  daily_summary?: boolean
  weekly_report?: boolean
  phone?: string
  [key: string]: unknown
}

export interface ChildReport {
  child: User
  weekly_nets?: number[]
  subject_analysis?: { subject: string; accuracy_rate: number; total_questions: number; correct: number }[]
  study_time_weekly_seconds?: number
  tasks_done_this_week?: number
  streak_days?: number
  xp_points?: number
  level?: number
  weak_kazanims?: WeakAchievement[]
  recent_exams?: ExamSession[]
  current_net?: number
  target_net?: number
}

export interface ChildSummary {
  child: User
  study_time_today_seconds?: number
  study_time_weekly_seconds?: number
  tasks_done_today?: number
  tasks_total_today?: number
  weekly_nets?: number[]
  current_net?: number
  target_net?: number
  streak_days?: number
  xp_points?: number
  level?: number
  risk_level?: 'green' | 'yellow' | 'red'
  exam_date?: string
  exam_goal?: string
}

export interface AdminReports {
  weekly_users?: { label: string; value: number }[]
  monthly_revenue?: { label: string; value: number }[]
  total_revenue?: number
  new_users_monthly?: number
  active_users?: number
  exam_completions?: number
  popular_subjects?: { subject: string; count: number }[]
}

export interface PlanStats {
  total: number
  completed: number
  pending: number
  streak?: number
  weekly_nets?: number[]
  study_time_today_seconds?: number
  study_time_weekly_seconds?: number
  tasks_done_today?: number
  tasks_total_today?: number
  xp_points?: number
  level?: number
  streak_days?: number
  current_net?: number
  target_net?: number
}

export interface AnswerResult {
  correct?: boolean
  is_correct?: boolean
  correct_option?: string
  explanation?: string
}

export interface WeakAchievement {
  id: number
  kod: string
  konu: string
  subject?: string
  accuracy_rate: number
  wrong_count: number
  total_count?: number
  kazanim?: string
  topic?: string
}

export interface DailyPlan {
  id?: number
  plan_date?: string
  date?: string
  tasks?: PlanTask[]
  total_tasks: number
  completed_tasks: number
  study_minutes_actual?: number
  study_minutes_planned?: number
}

export interface StudentStatistics {
  study_time_today_seconds?: number
  study_time_weekly_seconds?: number
  tasks_done_today?: number
  tasks_total_today?: number
  xp_points?: number
  level?: number
  streak_days?: number
  current_net?: number
  target_net?: number
  weekly_nets?: number[]
}

export interface GoalAnalysis {
  target_net: number
  current_net: number
  predicted_net?: number
  days_remaining: number
  weekly_net_needed?: number
  risk_level?: 'green' | 'yellow' | 'red'
  exam_date?: string
  exam_type?: string
}

export interface BadgeData {
  badges: (Badge & { emoji?: string; progress?: number; required?: number; earned_at?: string })[]
  xp: number
  level: number
  xp_next_level: number
  streak_days: number
  weekly_champion?: { name: string; study_minutes?: number; net_increase?: number }
}

export interface Assignment {
  id: number
  title: string
  description?: string
  due_date?: string
  subject?: string
  status?: string
  class_id?: number
  file_url?: string
  created_at?: string
}

export interface ContentItem {
  id: number
  type?: 'video' | 'pdf' | 'text' | 'quiz'
  title?: string
  url?: string
  duration_seconds?: number
  topic_id?: number
  sort_order?: number
  progress_status?: 'not_started' | 'in_progress' | 'completed'
  is_active?: boolean
}

export interface CourseTopic {
  id: number
  title: string
  slug?: string
  sort_order?: number
  content_items_count?: number
  contentItems?: ContentItem[]
  progress?: string
  is_active?: boolean
}

export interface CourseUnit {
  id: number
  title: string
  slug?: string
  sort_order?: number
  topics?: CourseTopic[]
  is_active?: boolean
}

export interface Course {
  id: number
  title: string
  slug: string
  description?: string
  subject?: string
  exam_type?: string
  grade?: number
  is_free?: boolean
  is_active?: boolean
  sort_order?: number
  units_count?: number
  progress_percent?: number
  completion_percentage?: number
  is_enrolled?: boolean
  units?: CourseUnit[]
  thumbnail_url?: string
  created_at?: string
}

export interface TeacherLesson {
  id: number
  title?: string
  status?: string
  starts_at?: string
  ends_at?: string
  duration_minutes?: number
  daily_room_url?: string
  class_room?: { name?: string; id?: number }
  teacher?: { name?: string; id?: number }
  reservation_id?: number
}

export interface VideoRoom {
  room_url?: string
  token?: string
  session_id?: string
}

export interface LiveSession {
  id: number
  title: string
  room_url?: string
  daily_room_url?: string
  daily_room_name?: string
  status?: string
  starts_at?: string
  scheduled_at?: string
  ends_at?: string
  class_id?: number
  duration_minutes?: number
  teacher_id?: number
  class_room?: { id?: number; name?: string; student_count?: number }
}

export interface TeacherMessage {
  id: number
  content: string
  sender_id?: number
  sender_name?: string
  class_id?: number
  created_at?: string
}

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/v1/auth/login', { email, password })
    return response.data
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/v1/auth/register', data)
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/v1/auth/logout')
  },

  async refresh(): Promise<{ token: { access_token: string } }> {
    const response = await api.post('/v1/auth/refresh')
    return response.data
  },

  async getMe(): Promise<User> {
    const response = await api.get<{ success: boolean; user: User }>('/auth/me')
    return response.data.user
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/v1/auth/forgot-password', { email })
  },

  async resetPassword(token: string, email: string, password: string, password_confirmation: string): Promise<void> {
    await api.post('/v1/auth/reset-password', { token, email, password, password_confirmation })
  },

  async verifyEmail(code: string, email?: string): Promise<void> {
    await api.post('/v1/auth/verify-email', { token: code, email, verification_code: code })
  },

  async resendVerification(email: string): Promise<void> {
    await api.post('/v1/auth/resend-verification', { email })
  },
}

// ─── Notification API ────────────────────────────────────────────────────────
export const notificationApi = {
  async getNotifications(_tokenOrParams?: string | { per_page?: number; page?: number }, params?: { per_page?: number; page?: number }): Promise<PaginatedResponse<Notification>> {
    // token opsiyonel — axios interceptor halleder
    const actualParams = typeof _tokenOrParams === 'object' ? _tokenOrParams : params
    const response = await api.get<PaginatedResponse<Notification>>('/notifications', { params: actualParams })
    const data = response.data
    if (Array.isArray(data)) {
      return { data: data as Notification[], current_page: 1, last_page: 1, per_page: 100, total: (data as Notification[]).length }
    }
    return data
  },

  async markNotificationRead(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.put(`/notifications/${actualId}/read`)
  },

  async markAllNotificationsRead(_token?: string): Promise<void> {
    await api.put('/notifications/read-all')
  },

  async deleteNotification(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.delete(`/notifications/${actualId}`)
  },

  async registerPushToken(_tokenOrPushToken?: string, pushTokenOrPlatform?: string, platform?: string): Promise<void> {
    // Overload: (token, pushToken, platform) veya (pushToken, platform)
    const actualPushToken = platform ? pushTokenOrPlatform : _tokenOrPushToken
    const actualPlatform = platform || pushTokenOrPlatform || 'web'
    await api.post('/push-token', { token: actualPushToken, platform: actualPlatform })
  },
}

// ─── User / Profile API ──────────────────────────────────────────────────────
export const userApi = {
  async updateProfile(_tokenOrData?: string | Partial<User>, data?: Partial<User>): Promise<User> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.patch<{ user: User; success: boolean } & Partial<User>>('/user/profile', actualData)
    return response.data.user ?? (response.data as unknown as User)
  },

  async updateGoal(_tokenOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): Promise<User> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ user: User; success: boolean }>('/user/goal', actualData)
    return response.data.user ?? (response.data as unknown as User)
  },

  async changePassword(_tokenOrData?: string | { current_password: string; password: string; password_confirmation: string }, data?: { current_password: string; password: string; password_confirmation: string }): Promise<void> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    await api.post('/user/change-password', actualData)
  },

  async uploadProfilePhoto(_tokenOrFile?: string | File, file?: File): Promise<{ url: string }> {
    const actualFile = typeof _tokenOrFile === 'string' ? file : _tokenOrFile
    const formData = new FormData()
    if (actualFile) formData.append('photo', actualFile)
    const response = await api.post<{ url: string; profile_photo_url: string }>('/user/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return { url: response.data.url ?? response.data.profile_photo_url }
  },

  async updateNotificationPreferences(_tokenOrData?: string | Record<string, boolean>, data?: Record<string, boolean>): Promise<void> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    await api.patch('/user/profile', actualData)
  },

  async getMe(_token?: string): Promise<User> {
    const response = await api.get<{ success: boolean; user: User }>('/auth/me')
    return response.data.user
  },
}

// ─── Plan API ────────────────────────────────────────────────────────────────
export const planApi = {
  async getTodayPlan(_token?: string): Promise<StudyPlan> {
    const response = await api.get<{ plan: StudyPlan; data: StudyPlan }>('/plan/today')
    return response.data.plan ?? response.data.data ?? (response.data as unknown as StudyPlan)
  },

  async getWeeklyPlans(_tokenOrFrom?: string, _from?: string, _to?: string): Promise<StudyPlan[]> {
    const response = await api.get<unknown>('/plan')
    return normalizeArray<StudyPlan>(response.data)
  },

  async getPlanStats(_token?: string): Promise<PlanStats> {
    const response = await api.get<PlanStats>('/plan/stats')
    return response.data
  },

  async addPlanTask(_tokenOrData?: string | { subject?: string; topic?: string; duration_minutes?: number; date?: string; title?: string; type?: string }, data?: { subject?: string; topic?: string; duration_minutes?: number; date?: string; title?: string; type?: string }): Promise<PlanTask> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ task: PlanTask; data: PlanTask }>('/plan/tasks', actualData)
    return response.data.task ?? response.data.data ?? (response.data as unknown as PlanTask)
  },

  async completeTask(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.patch(`/plan/tasks/${actualId}/complete`)
  },

  async deleteTask(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.delete(`/plan/tasks/${actualId}`)
  },

  async startStudySession(_tokenOrData?: string | { task_id?: number; subject?: string }, data?: { task_id?: number; subject?: string }): Promise<{ session_id: number }> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ session_id: number }>('/plan/study-session/start', actualData)
    return response.data
  },

  async endStudySession(_tokenOrId?: string | number, idOrData?: number | { notes?: string }, data?: { notes?: string }): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : (typeof idOrData === 'number' ? idOrData : undefined)
    const actualData = typeof _tokenOrId === 'number' ? idOrData as { notes?: string } : data
    await api.post(`/plan/study-session/${actualId}/end`, actualData)
  },
}

// ─── Exam API ────────────────────────────────────────────────────────────────
export const examApi = {
  async startExam(_tokenOrData?: string | { exam_type: string; subject?: string; question_count?: number; difficulty?: string; duration_minutes?: number }, data?: { exam_type: string; subject?: string; question_count?: number; difficulty?: string; duration_minutes?: number }): Promise<ExamSession & { session?: ExamSession; questions?: Question[] }> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<ExamSession & { session?: ExamSession; questions?: Question[] }>('/exams/start', actualData)
    return response.data
  },

  async getExamHistory(_token?: string): Promise<ExamSession[]> {
    const response = await api.get<unknown>('/exams/history')
    return normalizeArray<ExamSession>(response.data)
  },

  async answerExamQuestion(_tokenOrId?: string | number, idOrData?: number | { question_id: number; answer: string }, data?: { question_id: number; answer: string }): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : (typeof idOrData === 'number' ? idOrData : undefined)
    const actualData = typeof _tokenOrId === 'number' ? (idOrData as { question_id: number; answer: string }) : data
    await api.post(`/exams/${actualId}/answer`, actualData)
  },

  async finishExam(_tokenOrId?: string | number, id?: number): Promise<ExamSession> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    const response = await api.post<{ session: ExamSession; result: ExamSession }>(`/exams/${actualId}/finish`)
    return response.data.result ?? response.data.session ?? (response.data as unknown as ExamSession)
  },

  async getExamResult(_tokenOrId?: string | number, id?: number | string): Promise<ExamSession> {
    const actualId = typeof _tokenOrId === 'string' && id !== undefined ? id : (typeof _tokenOrId === 'number' ? _tokenOrId : id)
    const response = await api.get<{ session: ExamSession; data: ExamSession }>(`/exams/${actualId}/result`)
    return response.data.session ?? response.data.data ?? (response.data as unknown as ExamSession)
  },
}

// ─── Question API ────────────────────────────────────────────────────────────
export const questionApi = {
  async getQuestions(_tokenOrParams?: string | { subject?: string; topic?: string; difficulty?: string; page?: number; per_page?: number; exam_type?: string }, params?: { subject?: string; topic?: string; difficulty?: string; page?: number; per_page?: number; exam_type?: string }): Promise<PaginatedResponse<Question>> {
    const actualParams = typeof _tokenOrParams === 'string' ? params : _tokenOrParams
    const response = await api.get<unknown>('/questions', { params: actualParams })
    const raw = response.data
    if (Array.isArray(raw)) return { data: raw as Question[], current_page: 1, last_page: 1, per_page: 20, total: (raw as Question[]).length }
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) return raw as PaginatedResponse<Question>
    return { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0 }
  },

  async answerQuestion(_tokenOrData?: string | { question_id: number; answer: string; time_spent?: number }, data?: { question_id: number; answer: string; time_spent?: number }): Promise<{ correct: boolean; explanation?: string }> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ correct: boolean; explanation?: string }>('/questions/answer', actualData)
    return response.data
  },

  async getWeakAchievements(_token?: string): Promise<WeakAchievement[]> {
    const response = await api.get<unknown>('/questions/weak')
    return normalizeArray<WeakAchievement>(response.data)
  },

  async getSimilarQuestions(_tokenOrId?: string | number, questionId?: number): Promise<Question[]> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : questionId
    const response = await api.get<unknown>('/questions/similar', { params: { question_id: actualId } })
    return normalizeArray<Question>(response.data)
  },

  async generatePersonalTest(_tokenOrParams?: string | { subject?: string; count?: number; difficulty?: string }, params?: { subject?: string; count?: number; difficulty?: string }): Promise<Question[]> {
    const actualParams = typeof _tokenOrParams === 'string' ? params : _tokenOrParams
    const response = await api.post<unknown>('/ai/personal-test', actualParams)
    return normalizeArray<Question>(response.data)
  },
}

// ─── Course / Content API ────────────────────────────────────────────────────
export const courseApi = {
  async getCourses(_token?: string): Promise<Course[]> {
    const response = await api.get<{ success: boolean; data: Course[] }>('/courses')
    const raw = response.data
    if (Array.isArray(raw)) return raw as Course[]
    if (raw?.data && Array.isArray(raw.data)) return raw.data as Course[]
    return []
  },

  async getCourse(_tokenOrId?: string, id?: string): Promise<Course | null> {
    const actualId = id ?? _tokenOrId
    try {
      const response = await api.get<{ success: boolean; data: Course }>(`/courses/${actualId}`)
      return response.data?.data ?? (response.data as unknown as Course)
    } catch {
      return null
    }
  },

  async getCourseUnits(_tokenOrId?: string | number, courseId?: string | number): Promise<CourseUnit[]> {
    // Backend GET /courses/{id} → { data: { units: [...] } }
    const actualId = (typeof _tokenOrId === 'number') ? _tokenOrId : (courseId ?? _tokenOrId)
    try {
      const response = await api.get<{ success: boolean; data: Course }>(`/courses/${actualId}`)
      const course = response.data?.data ?? (response.data as unknown as Course)
      return Array.isArray(course?.units) ? course.units : []
    } catch {
      return []
    }
  },

  async getTopicContent(_tokenOrId?: string | number, topicId?: string | number): Promise<ContentItem[]> {
    // Backend'de ayrı bir topic content endpoint'i yok.
    // İçerik getCourseUnits ile gelen contentItems'tan çekiliyor.
    // Burada direkt boş array döneriz; sayfalar zaten getCourseUnits sonucundan faydalanıyor.
    try {
      const actualId = (typeof _tokenOrId === 'number') ? _tokenOrId : (topicId ?? _tokenOrId)
      // Önce /courses/topic/{id} dene (eğer backend'de varsa)
      const response = await api.get<unknown>(`/courses/topic/${actualId}`)
      return normalizeArray<ContentItem>(response.data)
    } catch {
      return []
    }
  },

  async enrollCourse(_tokenOrId?: string | number, courseId?: string | number): Promise<void> {
    const actualId = typeof _tokenOrId === 'string' && courseId ? courseId : _tokenOrId
    await api.post(`/courses/${actualId}/enroll`)
  },

  async updateProgress(_tokenOrData?: string | { topic_id: number; progress?: number; completed?: boolean; score?: number; status?: string }, data?: { topic_id: number; progress?: number; completed?: boolean; score?: number; status?: string }): Promise<void> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    await api.post('/progress', actualData)
  },

  async summarizeContent(_tokenOrTextOrObj?: string | { text?: string; topic_id?: number }, textOrObj?: string | { text?: string; topic_id?: number }): Promise<{ summary: string }> {
    const actualData = typeof _tokenOrTextOrObj === 'string' && textOrObj !== undefined ? textOrObj : _tokenOrTextOrObj
    const payload = typeof actualData === 'string' ? { text: actualData } : actualData
    const response = await api.post<{ summary: string }>('/ai/summarize', payload)
    return response.data
  },
}

// ─── Student API ─────────────────────────────────────────────────────────────
export const studentApi = {
  async getBadges(_token?: string): Promise<BadgeData> {
    const response = await api.get<BadgeData & { data?: unknown }>('/student/badges')
    const d = response.data
    if (Array.isArray(d)) return { badges: d, xp: 0, level: 1, xp_next_level: 1000, streak_days: 0 }
    if (d.badges && Array.isArray(d.badges)) return d as BadgeData
    return { badges: [], xp: 0, level: 1, xp_next_level: 1000, streak_days: 0 }
  },

  async getLeaderboard(_tokenOrPeriod?: string, period?: string): Promise<LeaderboardEntry[]> {
    // Eğer _tokenOrPeriod "weekly" veya "monthly" gibi bir period değeriyse, onu kullan
    const isPeriod = (s?: string) => s === 'weekly' || s === 'monthly'
    const actualPeriod = isPeriod(_tokenOrPeriod) ? _tokenOrPeriod : period
    const response = await api.get<unknown>('/student/leaderboard', { params: actualPeriod ? { period: actualPeriod } : undefined })
    return normalizeArray<LeaderboardEntry>(response.data)
  },

  async getStudentUpcomingLessons(_token?: string): Promise<unknown[]> {
    const response = await api.get<unknown>('/student/upcoming-lessons')
    return normalizeArray(response.data)
  },

  async generateParentCode(_token?: string): Promise<{ code: string }> {
    const response = await api.post<{ code: string }>('/student/generate-parent-code')
    return response.data
  },

  async getGoalEngine(_token?: string): Promise<unknown> {
    const response = await api.get<unknown>('/student/goal-engine')
    return response.data
  },

  async getReport(_token?: string): Promise<unknown> {
    const response = await api.get<unknown>('/student/report')
    return response.data
  },

  async getNotificationSettings(_token?: string): Promise<unknown> {
    try {
      const response = await api.get<unknown>('/student/notification-settings')
      return response.data
    } catch {
      return {}
    }
  },

  async updateNotificationSettings(_token?: string, settings?: Record<string, boolean>): Promise<unknown> {
    const response = await api.post<unknown>('/student/notification-settings', settings ?? {})
    return response.data
  },

  async registerPushToken(_tokenOrPushToken?: string, pushTokenOrPlatform?: string, platform?: string): Promise<void> {
    const actualPushToken = platform ? pushTokenOrPlatform : _tokenOrPushToken
    const actualPlatform = platform || pushTokenOrPlatform || 'web'
    await api.post('/push-token', { token: actualPushToken, platform: actualPlatform })
  },
}

// ─── AI / Coach API ──────────────────────────────────────────────────────────
export const aiApi = {
  async askCoach(_tokenOrMsg?: string, msgOrContext?: string | unknown, context?: unknown): Promise<{ reply: string; suggestions?: string[] }> {
    const actualMsg = typeof msgOrContext === 'string' ? msgOrContext : _tokenOrMsg
    const actualContext = typeof msgOrContext === 'string' ? context : msgOrContext
    const response = await api.post<{ reply: string; suggestions?: string[] }>('/ai/ask-coach', { message: actualMsg, context: actualContext })
    return response.data
  },

  async getCoachHistory(_token?: string): Promise<{ role: string; content: string; created_at?: string }[]> {
    const response = await api.get<unknown>('/ai/coach/history')
    // Backend { messages: [...] } veya [...] dönebilir
    const raw = response.data
    if (Array.isArray(raw)) return raw as { role: string; content: string; created_at?: string }[]
    const obj = raw as Record<string, unknown>
    return normalizeArray(obj.messages ?? obj.data ?? raw)
  },

  async clearCoachHistory(_token?: string): Promise<void> {
    await api.delete('/ai/coach/history')
  },

  async generateQuestion(_tokenOrParams?: string | { subject?: string; topic?: string; difficulty?: string }, params?: { subject?: string; topic?: string; difficulty?: string }): Promise<Question> {
    const actualParams = typeof _tokenOrParams === 'string' ? params : _tokenOrParams
    const response = await api.post<{ question: Question }>('/ai/generate-question', actualParams)
    return response.data.question ?? (response.data as unknown as Question)
  },

  async getHardAchievements(_tokenOrParams?: string | { limit?: number }, _params?: { limit?: number }): Promise<unknown[]> {
    const response = await api.get<unknown>('/ai/hard-achievements')
    return normalizeArray(response.data)
  },

  async getGoalAnalysis(_token?: string): Promise<GoalAnalysis> {
    const response = await api.get<GoalAnalysis>('/student/goal-engine')
    return response.data
  },
}

// ─── Teacher API ─────────────────────────────────────────────────────────────
export const teacherApi = {
  async getTeacherStats(_token?: string): Promise<unknown> {
    const response = await api.get<unknown>('/teacher/stats')
    return response.data
  },

  async getTeacherClasses(_token?: string): Promise<TeacherClass[]> {
    const response = await api.get<unknown>('/teacher/classes')
    return normalizeArray<TeacherClass>(response.data)
  },

  async createClass(_tokenOrData?: string | { name: string; subject?: string }, data?: { name: string; subject?: string }): Promise<TeacherClass> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ class: TeacherClass }>('/teacher/classes', actualData)
    return response.data.class ?? (response.data as unknown as TeacherClass)
  },

  async getClassStudents(_tokenOrId?: string | number, classId?: number): Promise<User[]> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : classId
    const response = await api.get<unknown>(`/teacher/classes/${actualId}/students`)
    return normalizeArray<User>(response.data)
  },

  async getRiskStudents(_token?: string): Promise<User[]> {
    const response = await api.get<unknown>('/teacher/students/risk')
    return normalizeArray<User>(response.data)
  },

  async getTeacherAssignments(_token?: string): Promise<Assignment[]> {
    const response = await api.get<unknown>('/teacher/assignments')
    return normalizeArray<Assignment>(response.data)
  },

  async createAssignment(_tokenOrData?: string | { title: string; description?: string; due_date?: string; class_id?: number; subject?: string; type?: string; content?: string }, data?: { title: string; description?: string; due_date?: string; class_id?: number; subject?: string }): Promise<Assignment> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ assignment: Assignment }>('/teacher/assignments', actualData)
    return response.data.assignment ?? (response.data as unknown as Assignment)
  },

  async updateAssignment(_tokenOrId?: string | number, idOrData?: number | Partial<Assignment>, data?: Partial<Assignment>): Promise<Assignment> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : (typeof idOrData === 'number' ? idOrData : undefined)
    const actualData = typeof _tokenOrId === 'number' ? (idOrData as Partial<Assignment>) : data
    const response = await api.patch<{ assignment: Assignment }>(`/teacher/assignments/${actualId}`, actualData)
    return response.data.assignment ?? (response.data as unknown as Assignment)
  },

  async deleteAssignment(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.delete(`/teacher/assignments/${actualId}`)
  },

  async getLiveSessions(_token?: string): Promise<LiveSession[]> {
    const response = await api.get<unknown>('/teacher/live-sessions')
    return normalizeArray<LiveSession>(response.data)
  },

  async createLiveSession(_tokenOrData?: string | { title: string; class_id?: number; starts_at?: string }, data?: { title: string; class_id?: number; starts_at?: string }): Promise<LiveSession> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ session: LiveSession }>('/teacher/live-sessions', actualData)
    return response.data.session ?? (response.data as unknown as LiveSession)
  },

  async getTeacherAnalytics(_tokenOrType?: string, type?: string): Promise<unknown> {
    const actualType = type ?? ((_tokenOrType && _tokenOrType !== 'string') ? _tokenOrType : 'overview')
    const response = await api.get<unknown>(`/teacher/analytics/${actualType}`)
    return response.data
  },

  async getTeacherMessages(_token?: string): Promise<TeacherMessage[]> {
    const response = await api.get<unknown>('/teacher/messages')
    return normalizeArray<TeacherMessage>(response.data)
  },

  async sendMessage(_tokenOrData?: string | { content: string; class_id?: number; recipient_id?: number; receiver_id?: number; recipient_type?: string }, data?: { content: string; class_id?: number; recipient_id?: number; receiver_id?: number; recipient_type?: string }): Promise<TeacherMessage> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    // Backend receiver_id bekliyor; recipient_id de gönderilmişse receiver_id'ye map et
    const payload = actualData ? {
      ...actualData,
      receiver_id: actualData.receiver_id ?? actualData.recipient_id,
    } : actualData
    const response = await api.post<{ message: TeacherMessage }>('/teacher/messages', payload)
    return response.data.message ?? (response.data as unknown as TeacherMessage)
  },

  // canli-ders için video room oluşturma/alma
  async getVideoRoom(_tokenOrId?: string | number, lessonId?: number): Promise<VideoRoom | null> {
    try {
      const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : lessonId
      const response = await api.post<VideoRoom>(`/video-call/start`, { lesson_id: actualId })
      return response.data
    } catch {
      return null
    }
  },

  // içerik yükleme
  async uploadContent(_token?: string, formData?: FormData): Promise<unknown> {
    try {
      const response = await api.post<unknown>('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch {
      return null
    }
  },
}

// ─── Parent API ──────────────────────────────────────────────────────────────
export const parentApi = {
  async getChildren(_token?: string): Promise<User[]> {
    const response = await api.get<unknown>('/parent/children')
    return normalizeArray<User>(response.data)
  },

  async getChildSummary(_tokenOrId?: string | number, childId?: number): Promise<unknown> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : childId
    const response = await api.get<unknown>(`/parent/children/${actualId}/summary`)
    return response.data
  },

  async linkChild(_tokenOrCode?: string, code?: string): Promise<void> {
    const actualCode = code ?? _tokenOrCode
    await api.post('/parent/link', { code: actualCode })
  },

  async getChildReport(_token?: string, childId?: number): Promise<unknown> {
    const response = await api.get<unknown>('/parent/child-report', { params: childId ? { child_id: childId } : {} })
    return response.data
  },

  async getParentNotificationSettings(_token?: string): Promise<Record<string, boolean>> {
    const response = await api.get<Record<string, boolean>>('/parent/notification-settings')
    return response.data
  },

  async updateParentNotificationSettings(_tokenOrData?: string | Record<string, boolean>, data?: Record<string, boolean>): Promise<void> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    await api.patch('/parent/notification-settings', actualData)
  },
}

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
  async getAdminStats(_token?: string): Promise<unknown> {
    const response = await api.get<unknown>('/admin/stats')
    return response.data
  },

  async getAdminUsers(_tokenOrParams?: string | { page?: number; per_page?: number; role?: string; search?: string }, params?: { page?: number; per_page?: number; role?: string; search?: string }): Promise<PaginatedResponse<User>> {
    const actualParams = typeof _tokenOrParams === 'string' ? params : _tokenOrParams
    const response = await api.get<unknown>('/admin/users', { params: actualParams })
    const raw = response.data as Record<string, unknown>
    if (Array.isArray(raw)) return { data: raw as User[], current_page: 1, last_page: 1, per_page: 50, total: (raw as User[]).length }
    if (Array.isArray(raw.data)) return raw as PaginatedResponse<User>
    return { data: [], current_page: 1, last_page: 1, per_page: 50, total: 0 }
  },

  async updateAdminUser(_tokenOrId?: string | number, idOrData?: number | (Partial<User> & { role?: string; status?: string; teacher_status?: string }), data?: Partial<User> & { role?: string; status?: string; teacher_status?: string }): Promise<User> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : (typeof idOrData === 'number' ? idOrData : undefined)
    const actualData = typeof _tokenOrId === 'number' ? (idOrData as Partial<User>) : data
    const response = await api.patch<{ user: User }>(`/admin/users/${actualId}`, actualData)
    return response.data.user ?? (response.data as unknown as User)
  },

  async deleteAdminUser(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.delete(`/admin/users/${actualId}`)
  },

  async toggleAdminUserStatus(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.post(`/admin/users/${actualId}/toggle-status`)
  },

  async getAdminContent(_tokenOrParams?: string | { page?: number }, params?: { page?: number }): Promise<unknown> {
    const actualParams = typeof _tokenOrParams === 'string' ? params : _tokenOrParams
    const response = await api.get<unknown>('/admin/content', { params: actualParams })
    return response.data
  },

  async deleteAdminContent(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.delete(`/admin/content/${actualId}`)
  },

  async getAdminReports(_token?: string): Promise<AdminReports> {
    const response = await api.get<AdminReports>('/admin/reports')
    return response.data
  },

  async getAdminAuditLogs(_tokenOrParams?: string | { page?: number; per_page?: number }, params?: { page?: number; per_page?: number }): Promise<unknown> {
    const actualParams = typeof _tokenOrParams === 'string' ? params : _tokenOrParams
    const response = await api.get<unknown>('/admin/audit-logs', { params: actualParams })
    return response.data
  },

  async getAdminQuestions(_tokenOrParams?: string | { page?: number; subject?: string }, params?: { page?: number; subject?: string }): Promise<PaginatedResponse<Question>> {
    const actualParams = typeof _tokenOrParams === 'string' ? params : _tokenOrParams
    const response = await api.get<unknown>('/admin/questions', { params: actualParams })
    const raw = response.data
    if (Array.isArray(raw)) return { data: raw as Question[], current_page: 1, last_page: 1, per_page: 20, total: (raw as Question[]).length }
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) return raw as PaginatedResponse<Question>
    return { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0 }
  },

  async createAdminQuestion(_tokenOrData?: string | Partial<Question>, data?: Partial<Question>): Promise<Question> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ question: Question }>('/admin/questions', actualData)
    return response.data.question ?? (response.data as unknown as Question)
  },

  async deleteAdminQuestion(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.delete(`/admin/questions/${actualId}`)
  },

  async getPendingTeachers(_token?: string): Promise<User[]> {
    const response = await api.get<unknown>('/admin/teachers/pending')
    return normalizeArray<User>(response.data)
  },

  async approveTeacher(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.post(`/admin/teachers/${actualId}/approve`)
  },

  async rejectTeacher(_tokenOrId?: string | number, idOrReason?: number | string, reason?: string): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : (typeof idOrReason === 'number' ? idOrReason : undefined)
    const actualReason = typeof _tokenOrId === 'number' ? (idOrReason as string) : reason
    await api.post(`/admin/teachers/${actualId}/reject`, { reason: actualReason })
  },

  async getAdminCoupons(_tokenOrSearch?: string, search?: string): Promise<unknown[]> {
    const actualSearch = search ?? undefined
    const response = await api.get<unknown>('/admin/coupons', { params: actualSearch ? { search: actualSearch } : undefined })
    return normalizeArray(response.data)
  },

  async createAdminCoupon(_tokenOrData?: string | { code: string; discount?: number; max_uses?: number; expires_at?: string }, data?: { code: string; discount?: number; max_uses?: number; expires_at?: string }): Promise<unknown> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<unknown>('/admin/coupons', actualData)
    return response.data
  },

  async updateAdminCoupon(_tokenOrId?: string | number, idOrData?: number | Record<string, unknown>, data?: Record<string, unknown>): Promise<unknown> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : (typeof idOrData === 'number' ? idOrData : undefined)
    const actualData = typeof _tokenOrId === 'number' ? (idOrData as Record<string, unknown>) : data
    const response = await api.patch<unknown>(`/admin/coupons/${actualId}`, actualData)
    return response.data
  },

  async deleteAdminCoupon(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.delete(`/admin/coupons/${actualId}`)
  },

  async updateAdminSettings(_tokenOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): Promise<void> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    await api.post('/admin/settings', actualData)
  },

  async getHardAchievements(_token?: string): Promise<unknown[]> {
    const response = await api.get<unknown>('/ai/hard-achievements')
    return normalizeArray(response.data)
  },
}

// ─── Payment API ─────────────────────────────────────────────────────────────
export const paymentApi = {
  async getPackages(_token?: string): Promise<unknown[]> {
    const response = await api.get<unknown>('/packages')
    return normalizeArray(response.data)
  },

  async initiatePayment(_tokenOrData?: string | { package_id: number; coupon_code?: string }, data?: { package_id: number; coupon_code?: string }): Promise<{ payment_url?: string; token?: string; iframe_url?: string }> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ payment_url?: string; token?: string; iframe_url?: string }>('/payment/initiate', actualData)
    return response.data
  },

  async applyCoupon(_tokenOrCode?: string, codeOrPackageId?: string | number, packageId?: number): Promise<{ discount: number; final_price: number; valid: boolean }> {
    const actualCode = typeof codeOrPackageId === 'string' ? codeOrPackageId : _tokenOrCode
    const actualPackageId = typeof codeOrPackageId === 'number' ? codeOrPackageId : packageId
    const response = await api.post<{ discount: number; final_price: number; valid: boolean }>('/payment/apply-coupon', { code: actualCode, package_id: actualPackageId })
    return response.data
  },

  async getSubscriptionStatus(_token?: string): Promise<{ plan: string; expires_at: string | null; is_active: boolean }> {
    const response = await api.get<{ plan: string; expires_at: string | null; is_active: boolean }>('/subscription/status')
    return response.data
  },
}

// ─── Contact API ──────────────────────────────────────────────────────────────
export const contactApi = {
  async contact(data: { name: string; email: string; message: string; subject?: string }): Promise<void> {
    await api.post('/v1/contact', data)
  },
}

// ─── Forum API (placeholder — backend endpoint hazır değil) ──────────────────
export const forumApi = {
  async getForumPosts(params?: { page?: number; subject?: string }): Promise<PaginatedResponse<unknown>> {
    try {
      const response = await api.get<unknown>('/forum/posts', { params })
      const raw = response.data
      if (Array.isArray(raw)) return { data: raw, current_page: 1, last_page: 1, per_page: 20, total: raw.length }
      const obj = raw as Record<string, unknown>
      if (Array.isArray(obj.data)) return raw as PaginatedResponse<unknown>
      return { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0 }
    } catch {
      return { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0 }
    }
  },

  async getForumPost(id: number): Promise<{ post: unknown; replies: unknown[] }> {
    try {
      const response = await api.get<{ post: unknown; replies: unknown[] }>(`/forum/posts/${id}`)
      return { post: response.data.post ?? response.data, replies: normalizeArray(response.data.replies ?? []) }
    } catch {
      return { post: null, replies: [] }
    }
  },

  async createForumPost(data: { title: string; content: string; subject?: string }): Promise<unknown> {
    try {
      const response = await api.post<unknown>('/forum/posts', data)
      return response.data
    } catch {
      return null
    }
  },

  async createForumReply(postId: number, data: { content: string }): Promise<unknown> {
    try {
      const response = await api.post<unknown>(`/forum/posts/${postId}/replies`, data)
      return response.data
    } catch {
      return null
    }
  },

  async likeForumPost(_tokenOrId?: string | number, postId?: number): Promise<unknown> {
    try {
      const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : postId
      const response = await api.post<unknown>(`/forum/posts/${actualId}/like`)
      return response.data
    } catch {
      return null
    }
  },

  async markForumReplyBest(_tokenOrPostId?: string | number, postIdOrReplyId?: number, replyId?: number): Promise<unknown> {
    try {
      const actualPostId = typeof _tokenOrPostId === 'number' ? _tokenOrPostId : (typeof postIdOrReplyId === 'number' ? postIdOrReplyId : undefined)
      const actualReplyId = typeof _tokenOrPostId === 'number' ? postIdOrReplyId : replyId
      const response = await api.post<unknown>(`/forum/posts/${actualPostId}/best-reply/${actualReplyId}`)
      return response.data
    } catch {
      return null
    }
  },
}

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  async getUserAnalytics(): Promise<unknown> {
    try {
      const response = await api.get<unknown>('/analytics/user')
      return response.data
    } catch {
      return null
    }
  },

  async trackEvent(data: { event: string; properties?: Record<string, unknown> }): Promise<void> {
    try {
      await api.post('/analytics/track', data)
    } catch {
      // Tracking hataları sessizce geçer
    }
  },
}

// ─── Curriculum API ───────────────────────────────────────────────────────────
export const curriculumApi = {
  async getCurriculum(grade?: string, examType?: string): Promise<{ subjects: CurriculumSubject[]; grade: string; exam_type: string }> {
    const params: Record<string, string> = {}
    if (grade) params.grade = grade
    if (examType) params.exam_type = examType
    const response = await api.get<{ subjects: CurriculumSubject[]; grade: string; exam_type: string }>('/curriculum', { params })
    return response.data
  },

  async getCurriculumSubject(slug: string): Promise<{ subject: CurriculumSubject; units: CurriculumUnit[] }> {
    const response = await api.get<{ subject: CurriculumSubject; units: CurriculumUnit[] }>(`/curriculum/${slug}`)
    return response.data
  },

  async updateCurriculumProgress(topicId: number, status: 'not_started' | 'in_progress' | 'completed'): Promise<unknown> {
    const response = await api.post<unknown>('/curriculum/progress', { topic_id: topicId, status })
    return response.data
  },

  async getMyCurriculumProgress(): Promise<{ progress: Array<{ slug: string; name: string; total_topics: number; completed_topics: number; progress_percent: number }> }> {
    const response = await api.get<{ progress: Array<{ slug: string; name: string; total_topics: number; completed_topics: number; progress_percent: number }> }>('/curriculum/progress')
    return response.data
  },
}

// ─── Unified api object — backwards compatibility ────────────────────────────
// Tüm modüler API'leri ana api nesnesine bağla
// Böylece api.getNotifications(...) gibi legacy çağrılar da çalışır

Object.assign(api, {
  // Auth
  ...authApi,
  // Notifications
  getNotifications: notificationApi.getNotifications.bind(notificationApi),
  markNotificationRead: notificationApi.markNotificationRead.bind(notificationApi),
  markAllNotificationsRead: notificationApi.markAllNotificationsRead.bind(notificationApi),
  deleteNotification: notificationApi.deleteNotification.bind(notificationApi),
  registerPushToken: notificationApi.registerPushToken.bind(notificationApi),
  // User
  updateProfile: userApi.updateProfile.bind(userApi),
  updateGoal: userApi.updateGoal.bind(userApi),
  changePassword: userApi.changePassword.bind(userApi),
  uploadProfilePhoto: userApi.uploadProfilePhoto.bind(userApi),
  updateNotificationPreferences: userApi.updateNotificationPreferences.bind(userApi),
  getNotificationSettings: studentApi.getNotificationSettings.bind(studentApi),
  updateNotificationSettings: studentApi.updateNotificationSettings.bind(studentApi),
  getMe: userApi.getMe.bind(userApi),
  // Plan
  getTodayPlan: planApi.getTodayPlan.bind(planApi),
  getWeeklyPlans: planApi.getWeeklyPlans.bind(planApi),
  getPlanStats: planApi.getPlanStats.bind(planApi),
  addPlanTask: planApi.addPlanTask.bind(planApi),
  completeTask: planApi.completeTask.bind(planApi),
  deleteTask: planApi.deleteTask.bind(planApi),
  startStudySession: planApi.startStudySession.bind(planApi),
  endStudySession: planApi.endStudySession.bind(planApi),
  // Exam
  startExam: examApi.startExam.bind(examApi),
  getExamHistory: examApi.getExamHistory.bind(examApi),
  answerExamQuestion: examApi.answerExamQuestion.bind(examApi),
  finishExam: examApi.finishExam.bind(examApi),
  getExamResult: examApi.getExamResult.bind(examApi),
  // Questions
  getQuestions: questionApi.getQuestions.bind(questionApi),
  answerQuestion: questionApi.answerQuestion.bind(questionApi),
  getWeakAchievements: questionApi.getWeakAchievements.bind(questionApi),
  getSimilarQuestions: questionApi.getSimilarQuestions.bind(questionApi),
  generatePersonalTest: questionApi.generatePersonalTest.bind(questionApi),
  // Courses
  getCourses: courseApi.getCourses.bind(courseApi),
  getCourse: courseApi.getCourse.bind(courseApi),
  getCourseUnits: courseApi.getCourseUnits.bind(courseApi),
  getTopicContent: courseApi.getTopicContent.bind(courseApi),
  enrollCourse: courseApi.enrollCourse.bind(courseApi),
  updateProgress: courseApi.updateProgress.bind(courseApi),
  summarizeContent: courseApi.summarizeContent.bind(courseApi),
  // Student
  getBadges: studentApi.getBadges.bind(studentApi),
  getLeaderboard: studentApi.getLeaderboard.bind(studentApi),
  getStudentUpcomingLessons: studentApi.getStudentUpcomingLessons.bind(studentApi),
  generateParentCode: studentApi.generateParentCode.bind(studentApi),
  getGoalEngine: studentApi.getGoalEngine.bind(studentApi),
  getStudentReport: studentApi.getReport.bind(studentApi),
  // AI
  askCoach: aiApi.askCoach.bind(aiApi),
  getCoachHistory: aiApi.getCoachHistory.bind(aiApi),
  clearCoachHistory: aiApi.clearCoachHistory.bind(aiApi),
  generateQuestion: aiApi.generateQuestion.bind(aiApi),
  getHardAchievements: aiApi.getHardAchievements.bind(aiApi),
  getGoalAnalysis: aiApi.getGoalAnalysis.bind(aiApi),
  // Teacher
  getTeacherStats: teacherApi.getTeacherStats.bind(teacherApi),
  getTeacherClasses: teacherApi.getTeacherClasses.bind(teacherApi),
  createClass: teacherApi.createClass.bind(teacherApi),
  getClassStudents: teacherApi.getClassStudents.bind(teacherApi),
  getRiskStudents: teacherApi.getRiskStudents.bind(teacherApi),
  getTeacherAssignments: teacherApi.getTeacherAssignments.bind(teacherApi),
  createAssignment: teacherApi.createAssignment.bind(teacherApi),
  updateAssignment: teacherApi.updateAssignment.bind(teacherApi),
  deleteAssignment: teacherApi.deleteAssignment.bind(teacherApi),
  getLiveSessions: teacherApi.getLiveSessions.bind(teacherApi),
  createLiveSession: teacherApi.createLiveSession.bind(teacherApi),
  getTeacherAnalytics: teacherApi.getTeacherAnalytics.bind(teacherApi),
  getTeacherMessages: teacherApi.getTeacherMessages.bind(teacherApi),
  sendMessage: teacherApi.sendMessage.bind(teacherApi),
  getVideoRoom: teacherApi.getVideoRoom.bind(teacherApi),
  uploadContent: teacherApi.uploadContent.bind(teacherApi),
  // Parent
  getChildren: parentApi.getChildren.bind(parentApi),
  getChildSummary: parentApi.getChildSummary.bind(parentApi),
  linkChild: parentApi.linkChild.bind(parentApi),
  getChildReport: parentApi.getChildReport.bind(parentApi),
  getParentNotificationSettings: parentApi.getParentNotificationSettings.bind(parentApi),
  updateParentNotificationSettings: parentApi.updateParentNotificationSettings.bind(parentApi),
  // Admin
  getAdminStats: adminApi.getAdminStats.bind(adminApi),
  getAdminUsers: adminApi.getAdminUsers.bind(adminApi),
  updateAdminUser: adminApi.updateAdminUser.bind(adminApi),
  deleteAdminUser: adminApi.deleteAdminUser.bind(adminApi),
  toggleAdminUserStatus: adminApi.toggleAdminUserStatus.bind(adminApi),
  getAdminContent: adminApi.getAdminContent.bind(adminApi),
  deleteAdminContent: adminApi.deleteAdminContent.bind(adminApi),
  getAdminReports: adminApi.getAdminReports.bind(adminApi),
  getAdminAuditLogs: adminApi.getAdminAuditLogs.bind(adminApi),
  getAdminQuestions: adminApi.getAdminQuestions.bind(adminApi),
  createAdminQuestion: adminApi.createAdminQuestion.bind(adminApi),
  deleteAdminQuestion: adminApi.deleteAdminQuestion.bind(adminApi),
  getPendingTeachers: adminApi.getPendingTeachers.bind(adminApi),
  approveTeacher: adminApi.approveTeacher.bind(adminApi),
  rejectTeacher: adminApi.rejectTeacher.bind(adminApi),
  getAdminCoupons: adminApi.getAdminCoupons.bind(adminApi),
  createAdminCoupon: adminApi.createAdminCoupon.bind(adminApi),
  updateAdminCoupon: adminApi.updateAdminCoupon.bind(adminApi),
  deleteAdminCoupon: adminApi.deleteAdminCoupon.bind(adminApi),
  updateAdminSettings: adminApi.updateAdminSettings.bind(adminApi),
  // Payment
  getPackages: paymentApi.getPackages.bind(paymentApi),
  initiatePayment: paymentApi.initiatePayment.bind(paymentApi),
  applyCoupon: paymentApi.applyCoupon.bind(paymentApi),
  getSubscriptionStatus: paymentApi.getSubscriptionStatus.bind(paymentApi),
  // Contact
  contact: contactApi.contact.bind(contactApi),
  // Forum
  getForumPosts: forumApi.getForumPosts.bind(forumApi),
  getForumPost: forumApi.getForumPost.bind(forumApi),
  createForumPost: forumApi.createForumPost.bind(forumApi),
  createForumReply: forumApi.createForumReply.bind(forumApi),
  likeForumPost: forumApi.likeForumPost.bind(forumApi),
  markForumReplyBest: forumApi.markForumReplyBest.bind(forumApi),
  // Analytics
  getUserAnalytics: analyticsApi.getUserAnalytics.bind(analyticsApi),
  trackEvent: analyticsApi.trackEvent.bind(analyticsApi),
  // Curriculum
  getCurriculum: curriculumApi.getCurriculum.bind(curriculumApi),
  getCurriculumSubject: curriculumApi.getCurriculumSubject.bind(curriculumApi),
  updateCurriculumProgress: curriculumApi.updateCurriculumProgress.bind(curriculumApi),
  getMyCurriculumProgress: curriculumApi.getMyCurriculumProgress.bind(curriculumApi),
})

export { authApi }
export default api

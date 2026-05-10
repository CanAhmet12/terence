import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'
import type { StudentGoalDashboard, RiskTier } from './goal-dashboard'
import { getPublicApiBaseUrl } from './public-api-base'

/** NEXT_PUBLIC_API_URL bazen .../api/v1 ile biter; istekler /v1/... kullanınca çift /v1/v1 oluşur. */
const API_BASE_URL = getPublicApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

type ApiErrorPayload = {
  message: string
  code?: string
  status?: number
  fieldErrors?: Record<string, string[]>
}

function translateApiMessage(raw?: string, code?: string): string {
  const normalized = (raw ?? '').trim()
  const map: Record<string, string> = {
    INVALID_CREDENTIALS: 'E-posta veya sifre hatali.',
    FORBIDDEN: 'Bu islem icin yetkin bulunmuyor.',
    UNAUTHORIZED: 'Oturum suresi doldu. Lutfen tekrar giris yap.',
    ACCOUNT_SUSPENDED: 'Hesabin askiya alinmistir.',
    REFRESH_TOKEN_INVALID: 'Oturum suresi doldu. Lutfen tekrar giris yap.',
    REFRESH_TOKEN_MISSING: 'Oturum suresi doldu. Lutfen tekrar giris yap.',
    GRADE_REQUIRED: 'Ogrenci hesabi icin sinif bilgisi zorunludur.',
    MAINTENANCE_MODE: 'Sistem bakimda. Lutfen daha sonra tekrar deneyin.',
    TEACHER_PENDING_APPROVAL: 'Ogretmen hesabiniz yonetici onayi bekliyor.',
    TEACHER_REJECTED: 'Ogretmen basvurunuz reddedildi.',
    'The email has already been taken.': 'Bu e-posta adresi zaten kayitli.',
    'The email has already been taken': 'Bu e-posta adresi zaten kayitli.',
    'The email field must be a valid email address.': 'Gecerli bir e-posta adresi gir.',
    'The email field must be a valid email address': 'Gecerli bir e-posta adresi gir.',
    'The password field must be at least 8 characters.': 'Sifre en az 8 karakter olmalidir.',
    'The password field must be at least 8 characters': 'Sifre en az 8 karakter olmalidir.',
    'The photo field is required.': 'Lutfen bir fotograf sec.',
    'The photo field is required': 'Lutfen bir fotograf sec.',
    'The photo must be an image.': 'Dosya bir resim olmali (JPEG, PNG, GIF veya WebP).',
    'The photo must be an image': 'Dosya bir resim olmali (JPEG, PNG, GIF veya WebP).',
    'The photo failed to upload.': 'Fotograf yuklenemedi. Baglantiyi ve dosya boyutunu kontrol et.',
    'The photo failed to upload': 'Fotograf yuklenemedi. Baglantiyi ve dosya boyutunu kontrol et.',
    'The photo must not be greater than 2048 kilobytes.': 'Dosya en fazla 5 MB olabilir.',
    'The photo must not be greater than 5120 kilobytes.': 'Dosya en fazla 5 MB olabilir.',
  }

  // Oncelik: Laravel / sunucunun dondugu somut mesaj (422 alan hatalari dahil)
  if (map[normalized]) return map[normalized]
  if (normalized.length > 0) return normalized

  // Mesaj yoksa kod ile genel metin
  if (code === 'VALIDATION_ERROR') return 'Girdigin bilgileri kontrol et ve tekrar dene.'
  if (code && map[code]) return map[code]
  return 'Bir hata olustu. Lutfen tekrar dene.'
}

function extractApiError(error: AxiosError): ApiErrorPayload {
  const status = error.response?.status
  const data = (error.response?.data ?? {}) as Record<string, unknown>
  const nestedError = (data.error && typeof data.error === 'object')
    ? data.error as Record<string, unknown>
    : null
  const code = (nestedError?.code as string | undefined) ?? (data.code as string | undefined)
  const errors = (data.errors && typeof data.errors === 'object')
    ? data.errors as Record<string, string[]>
    : undefined
  const rawMessage = (nestedError?.message as string | undefined)
    ?? (data.message as string | undefined)
    ?? error.message

  if (!error.response) {
    return {
      message: 'Sunucuya baglanilamadi. Internet baglantini kontrol et.',
      code,
      status,
    }
  }

  if (status === 422 && errors) {
    const firstField = Object.keys(errors)[0]
    const firstMessage = firstField && Array.isArray(errors[firstField]) ? errors[firstField][0] : rawMessage
    return {
      message: translateApiMessage(firstMessage, code),
      code,
      status,
      fieldErrors: errors,
    }
  }

  if (status === 429) {
    const retryAfter = error.response.headers?.['retry-after']
    return {
      message: `Cok fazla istek gonderildi. ${retryAfter ? `${retryAfter} saniye sonra` : 'Kisa bir sure sonra'} tekrar dene.`,
      code,
      status,
    }
  }

  if (status === 500) {
    const serverMsg =
      typeof data.message === 'string' && data.message.trim().length > 0
        ? data.message.trim()
        : ''
    // Laravel Handler / controller bazen anlamlı mesaj döner; kullanıcıya göster
    if (serverMsg && serverMsg.length < 400 && !serverMsg.includes('<')) {
      return {
        message: serverMsg,
        code,
        status,
      }
    }
    return {
      message: 'Sunucuda gecici bir hata olustu. Lutfen biraz sonra tekrar dene.',
      code,
      status,
    }
  }

  return {
    message: translateApiMessage(rawMessage, code),
    code,
    status,
    fieldErrors: errors,
  }
}

// ─── Request Interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // FormData: varsayılan 'application/json' veya elle 'multipart' boundary'siz header dosyayı sunucuya ulaştırmaz
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const h = config.headers
      if (h && typeof h === 'object' && 'delete' in h && typeof (h as { delete: (k: string) => void }).delete === 'function') {
        (h as { delete: (k: string) => void }).delete('Content-Type')
      } else if (h && typeof h === 'object') {
        delete (h as Record<string, unknown>)['Content-Type']
      }
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

    const statusEarly = error.response?.status
    if (statusEarly === 503) {
      const data503 = (error.response?.data ?? {}) as Record<string, unknown>
      const nested503 =
        data503.error && typeof data503.error === 'object' ? (data503.error as Record<string, unknown>) : null
      const code503 = nested503?.code as string | undefined
      if (code503 === 'MAINTENANCE_MODE' && typeof window !== 'undefined') {
        const p = window.location.pathname
        if (!p.startsWith('/admin') && p !== '/bakim') {
          window.location.assign('/bakim')
        }
        return Promise.reject(error)
      }
    }

    const status403 = error.response?.status
    if (status403 === 403) {
      const data403 = (error.response?.data ?? {}) as Record<string, unknown>
      const nested403 =
        data403.error && typeof data403.error === 'object' ? (data403.error as Record<string, unknown>) : null
      const code403 = nested403?.code as string | undefined
      if (
        (code403 === 'TEACHER_PENDING_APPROVAL' || code403 === 'TEACHER_REJECTED') &&
        typeof window !== 'undefined'
      ) {
        const p = window.location.pathname
        if (!p.startsWith('/ogretmen/onay-bekleniyor')) {
          window.location.assign('/ogretmen/onay-bekleniyor')
        }
        return Promise.reject(error)
      }
    }

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
        // Don't force page reload - let the auth context handle redirect
        // window.location.href will cause infinite refresh loops
        return Promise.reject(error)
      }
    }

    const parsed = extractApiError(error)
    if (parsed.status && [422, 403, 429, 500].includes(parsed.status)) {
      const skipToast403 =
        parsed.code === 'TEACHER_PENDING_APPROVAL' ||
        parsed.code === 'TEACHER_REJECTED'
      if (!skipToast403) {
        toast.error(parsed.message)
      }
    }

    const normalizedError = new Error(parsed.message) as Error & ApiErrorPayload
    normalizedError.name = 'ApiError'
    normalizedError.code = parsed.code
    normalizedError.status = parsed.status
    normalizedError.fieldErrors = parsed.fieldErrors

    return Promise.reject(normalizedError)
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
  grade?: number | string
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
  rejection_reason?: string | null
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
  kazanim_code?: string
  difficulty?: string
  question_text: string
  options?: { id?: number; option_letter: string; option_text: string; is_correct?: boolean }[]
  correct_answer?: string
  explanation?: string
  image_url?: string
}

export interface ExamSession {
  id: number
  exam_type?: string
  exam_template_id?: number
  status?: string
  score?: number
  /** Net skor (TYT vb.); backend `finish` / `result` yanıtlarında dönebilir */
  net_score?: number
  title?: string
  subject_breakdown?: Record<string, { correct: number; wrong: number; empty: number; net: number }>
  time_spent_seconds?: number
  total_questions?: number
  correct_count?: number
  wrong_count?: number
  empty_count?: number
  duration_minutes?: number
  started_at?: string
  finished_at?: string
  questions?: Question[]
}

/** Öğrenci deneme kataloğu — GET /v1/exams/templates */
export type ExamTemplateCatalogItem = {
  id: number
  title: string
  slug: string
  exam_type: string
  grade: number | null
  duration_minutes: number
  description?: string | null
  question_count: number
}

export type ExamTemplateAdminRow = {
  id: number
  title: string
  slug: string
  exam_type: string
  grade: number | null
  duration_minutes: number
  description?: string | null
  is_active: boolean
  sort_order: number
  published_at?: string | null
  template_questions_count?: number
}

export type ExamTemplateQuestionRow = {
  sort_order: number
  question_id: number
  section: string | null
  subject?: string | null
  grade?: number | null
  exam_type?: string | null
  is_active?: boolean
  preview?: string | null
}

export type StartExamPayload = {
  exam_type: string
  subject?: string
  question_count?: number
  difficulty?: string
  duration_minutes?: number
  title?: string
  mode?: "pool" | "template"
  exam_template_id?: number
  template_slug?: string
}

/** POST /exams/{id}/answer gövdesi — backend ExamController ile uyumlu */
export interface ExamAnswerPayload {
  question_id: number
  selected_option?: string | null
  is_flagged?: boolean
  time_spent_seconds?: number
}

// ─── Curriculum (Müfredat) Interfaces ────────────────────────────────────────

export interface CurriculumContentItem {
  id: number
  type: 'video' | 'pdf' | 'quiz' | 'text'
  title: string
  url?: string
  /** PDF sayfa görselleri (JPEG URL listesi) */
  pdf_page_urls?: string[]
  /** Özel kapak veya CDN; yoksa istemci YouTube vb. için türetir */
  thumbnail_url?: string | null
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

/** GET /curriculum/media-catalog — düz medya listesi */
export interface MediaCatalogItem {
  key: string
  source: 'curriculum'
  content_type: 'video' | 'pdf' | 'text'
  id: number
  title: string
  url: string | null | undefined
  duration_seconds: number | null
  is_free: boolean
  subject_slug: string
  subject_name: string
  subject_icon?: string | null
  subject_color?: string | null
  grade: string
  exam_type: string
  curriculum_topic_id: number
  topic_title: string
  unit_title: string
  topic_status: string
  sort_order: number
  /** Sunucunun çözdüğü kapak (özel > video kaydı > YouTube) */
  thumbnail_url?: string | null
  /** PDF kitap görünümü için sayfa URL’leri */
  pdf_page_urls?: string[]
}

export interface MediaCatalogSubjectSummary {
  slug: string
  name: string
  icon?: string | null
  color?: string | null
  grade: string
  exam_type: string
  media_count: number
  total_topics: number
  completed_topics: number
  progress_percent: number
}

export interface MediaCatalogResponse {
  items: MediaCatalogItem[]
  subjects_summary: MediaCatalogSubjectSummary[]
  grade: string
  exam_type: string
}

export type PlanTaskSource = 'student' | 'teacher' | 'system'

export interface PlanTask {
  id: number
  title?: string
  subject?: string
  topic?: string
  /** API alanı; UI'da süre için öncelikli */
  planned_minutes?: number
  /** Eski istemciler */
  duration_minutes?: number
  is_completed?: boolean
  completed?: boolean
  order?: number
  type?: string
  notes?: string
  source?: PlanTaskSource
  assigned_by_user_id?: number | null
  class_room_id?: number | null
  teacher_batch_id?: string | null
  student_editable?: boolean
  requirement?: string
  cancelled_at?: string | null
  priority?: string
  sort_order?: number
}

export interface PlanTemplatePack {
  key: string
  label: string
  description: string
  tasks: Array<{
    title: string
    type?: string
    subject?: string
    planned_minutes?: number
    priority?: string
  }>
}

export interface StudyPlan {
  id?: number
  date?: string
  plan_date?: string
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

/** GET /teacher/classes/{id}/exam-summary satırı */
export interface TeacherClassExamSummaryRow {
  student_id: number
  name: string
  exams_completed_30d: number
  last_net: number | null
  last_exam_type?: string | null
  last_finished_at?: string | null
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
  solution_video?: string
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

export interface QuestionBankKpis {
  total_questions: number
  answered_distinct: number
  attempts: number
  accuracy_pct: number
  net_estimate: number
}

export interface QuestionBankBookDisplay {
  badge_label?: string | null
  year_label?: string | null
  brand_label?: string | null
  title_override?: string | null
  footer_label?: string | null
  cta_label?: string | null
  cover_hex?: string | null
}

export interface QuestionBankDisplayRow {
  id: number
  subject: string
  grade: number
  badge_label?: string | null
  year_label?: string | null
  brand_label?: string | null
  title_override?: string | null
  footer_label?: string | null
  cta_label?: string | null
  cover_hex?: string | null
  sort_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type QuestionBankDisplayInput = {
  subject: string
  grade?: number
  badge_label?: string | null
  year_label?: string | null
  brand_label?: string | null
  title_override?: string | null
  footer_label?: string | null
  cta_label?: string | null
  cover_hex?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface QuestionBankSubjectSummary {
  subject: string
  total: number
  answered: number
  correct_rate: number | null
  cta_deep_link: string
  book_display?: QuestionBankBookDisplay | null
}

export interface QuestionBankExamTabRow {
  exam_type: string
  question_count: number
}

export interface QuestionBankSummary {
  kpis: QuestionBankKpis
  subjects: QuestionBankSubjectSummary[]
  exam_tabs: QuestionBankExamTabRow[]
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

function riskTierToGoalAnalysisLevel(t: RiskTier): 'green' | 'yellow' | 'red' {
  if (t === 'critical') return 'red'
  if (t === 'at_risk') return 'yellow'
  return 'green'
}

export function mapDashboardToLegacyGoalAnalysis(d: StudentGoalDashboard): GoalAnalysis {
  const ins = d.insights
  const snap = d.user_snapshot
  const current =
    ins.display_current_net ??
    (typeof snap.current_net === 'number' ? snap.current_net : Number(snap.current_net ?? 0))
  const targetRaw = ins.display_target_net ?? snap.target_net
  const target = targetRaw !== null && targetRaw !== undefined ? Number(targetRaw) : 0
  return {
    target_net: target,
    current_net: Number(current),
    days_remaining: ins.days_remaining ?? 0,
    weekly_net_needed: ins.weekly_net_needed ?? 0,
    risk_level: riskTierToGoalAnalysisLevel(ins.risk_tier),
    exam_date: snap.exam_date ?? undefined,
    exam_type: snap.target_exam ?? snap.exam_goal ?? undefined,
    predicted_net: undefined,
  }
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
  /** content_items.thumbnail_url — video.kapak ve YouTube’dan öncelikli */
  thumbnail_url?: string | null
  duration_seconds?: number
  topic_id?: number
  sort_order?: number
  progress_status?: 'not_started' | 'in_progress' | 'completed'
  is_active?: boolean
  is_free?: boolean
  video?: {
    cdn_url?: string
    thumbnail_url?: string
    duration_seconds?: number
  }
  pdf_page_urls?: string[]
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
  scheduled_at?: string
  ends_at?: string
  started_at?: string
  duration_minutes?: number
  daily_room_url?: string
  recording_url?: string | null
  subject_tag?: string | null
  description?: string | null
  is_public?: boolean
  participant_count?: number
  class_room?: { name?: string; id?: number }
  teacher?: { name?: string; id?: number; profile_photo_url?: string | null }
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
  started_at?: string
  ended_at?: string
  class_id?: number
  class_room_id?: number | null
  is_public?: boolean
  subject_tag?: string | null
  description?: string | null
  recording_url?: string | null
  attendances_count?: number
  duration_minutes?: number
  teacher_id?: number
  class_room?: { id?: number; name?: string; student_count?: number }
}

export interface StudentLiveLessonsSummary {
  upcoming_this_week: number
  joined_this_month: number
  minutes_this_month: number
}

export interface TeacherMessage {
  id: number
  content: string
  sender_id?: number
  sender_name?: string
  class_id?: number
  created_at?: string
}

export interface TeacherCurriculumTopicRow {
  id: number
  title: string
  meb_code?: string | null
  unit_title?: string | null
  subject_name?: string | null
  subject_slug?: string | null
  grade?: string | null
  exam_type?: string | null
}

export type SearchCurriculumTopicsOptions = {
  limit?: number
  grade?: string
  exam_type?: string
}

export interface TeacherCurriculumUploadResponse {
  success: boolean
  content_item?: {
    id: number
    type: string
    title: string
    url?: string | null
    thumbnail_url?: string | null
    description?: string | null
    is_free?: boolean
  }
  curriculum_topic_id?: number
  curriculum_topic_title?: string
  linked_course?: {
    id: number
    title: string
    grade?: string | number | null
    exam_type?: string | null
    subject?: string | null
  } | null
  error?: boolean
  message?: string
}

/** Admin içerik listesi satırı (GET /admin/content) */
export interface AdminContentItem {
  id: number
  type: string
  title: string
  thumbnail_url?: string | null
  description?: string | null
  size_bytes?: number | null
  created_at?: string | null
  is_free?: boolean
  topic_title?: string | null
  unit?: string | null
  subject?: string | null
  course_title?: string | null
  course_grade?: string | number | null
  course_exam_type?: string | null
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
    const response = await api.post<{ user?: User; success: boolean }>('/user/goal', actualData)
    if (response.data.user) return response.data.user
    return userApi.getMe()
  },

  async changePassword(_tokenOrData?: string | { current_password: string; password: string; password_confirmation: string }, data?: { current_password: string; password: string; password_confirmation: string }): Promise<void> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    await api.post('/user/change-password', actualData)
  },

  async uploadProfilePhoto(_tokenOrFile?: string | File, file?: File): Promise<{ url: string }> {
    const actualFile = typeof _tokenOrFile === 'string' ? file : _tokenOrFile
    if (!actualFile) throw new Error('Dosya secilmedi')

    const postPhoto = async (authToken: string | null) => {
      const fd = new FormData()
      fd.append('photo', actualFile)
      return fetch(`${API_BASE_URL}/user/photo`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: fd,
      })
    }

    let token = getAccessToken()
    let res = await postPhoto(token)

    if (res.status === 401 && token) {
      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken =
          refreshResponse.data?.token?.access_token ||
          refreshResponse.data?.access_token
        if (newToken) {
          setAccessToken(newToken)
          res = await postPhoto(newToken)
        }
      } catch {
        /* tek deneme */
      }
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>

    if (!res.ok) {
      const errors = (data.errors && typeof data.errors === 'object')
        ? (data.errors as Record<string, string[]>)
        : undefined
      let raw =
        (typeof data.message === 'string' && data.message.trim()) ||
        ''
      if (!raw && errors) {
        const firstKey = Object.keys(errors)[0]
        const arr = firstKey ? errors[firstKey] : undefined
        raw = Array.isArray(arr) ? arr[0] : ''
      }
      const msg = translateApiMessage(raw || undefined, data.code as string | undefined)
      const err = new Error(msg) as Error & ApiErrorPayload
      err.name = 'ApiError'
      err.status = res.status
      err.fieldErrors = errors
      throw err
    }

    const url = (data.url as string | undefined) ?? (data.profile_photo_url as string | undefined)
    if (!url) throw new Error('Sunucu fotograf adresi dondurmedi')
    return { url }
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

  async getPlanTemplates(_token?: string): Promise<PlanTemplatePack[]> {
    const response = await api.get<{ success?: boolean; templates?: PlanTemplatePack[] }>('/plan/templates')
    return response.data.templates ?? []
  },

  async addPlanTask(_tokenOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): Promise<PlanTask> {
    const actualData = (typeof _tokenOrData === 'string' ? data : _tokenOrData) as Record<string, unknown>
    const payload = { ...actualData }
    if (payload.planned_minutes == null && payload.duration_minutes != null) {
      payload.planned_minutes = payload.duration_minutes
      delete payload.duration_minutes
    }
    const response = await api.post<{ task: PlanTask; data: PlanTask }>('/plan/tasks', payload)
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

  async startStudySession(_tokenOrData?: string | { plan_task_id?: number; subject?: string }, data?: { plan_task_id?: number; subject?: string }): Promise<{ session_id: number }> {
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

/** GET /exams/summary — tamamlanan deneme KPI özeti */
export interface ExamSummaryStats {
  total_completed: number
  this_week_count: number
  avg_net: number
  best_net: number
  avg_time_seconds: number
}

/** Laravel `GET /exams/{id}/result`, `POST /exams/{id}/finish` vb. yanıtlarını tek `ExamSession` şekline indirger */
export function normalizeExamSessionFromApi(payload: unknown): ExamSession {
  if (payload == null || typeof payload !== 'object') {
    return { id: 0 }
  }
  const o = payload as Record<string, unknown>
  const nested =
    (o.result as ExamSession | undefined) ??
    (o.session as ExamSession | undefined) ??
    (o.data as ExamSession | undefined)
  if (nested && typeof nested === 'object' && typeof (nested as ExamSession).id === 'number') {
    return nested as ExamSession
  }
  if (typeof o.session_id === 'number') {
    return {
      id: o.session_id,
      correct_count: o.correct_count as number | undefined,
      wrong_count: o.wrong_count as number | undefined,
      empty_count: o.empty_count as number | undefined,
      net_score: o.net_score as number | undefined,
      subject_breakdown: o.subject_breakdown as ExamSession['subject_breakdown'],
      time_spent_seconds: o.time_spent_seconds as number | undefined,
      status: 'completed',
    }
  }
  if (typeof o.id === 'number') {
    return o as unknown as ExamSession
  }
  return { id: 0 }
}

// ─── Exam API ────────────────────────────────────────────────────────────────
export const examApi = {
  async listExamTemplates(params?: { exam_type?: string }): Promise<ExamTemplateCatalogItem[]> {
    const response = await api.get<{ success?: boolean; data?: ExamTemplateCatalogItem[] }>("/v1/exams/templates", {
      params: params?.exam_type ? { exam_type: params.exam_type } : undefined,
    })
    const d = response.data
    if (Array.isArray(d?.data)) return d.data
    return []
  },

  async startExam(
    _tokenOrData?: string | StartExamPayload,
    data?: StartExamPayload
  ): Promise<ExamSession & { session?: ExamSession; questions?: Question[] }> {
    const actualData = typeof _tokenOrData === "string" ? data : _tokenOrData
    const response = await api.post<ExamSession & { session?: ExamSession; questions?: Question[] }>(
      "/v1/exams/start",
      actualData
    )
    return response.data
  },

  async getExamHistory(_token?: string): Promise<ExamSession[]> {
    const response = await api.get<unknown>('/v1/exams/history')
    return normalizeArray<ExamSession>(response.data)
  },

  async getExamSummary(_token?: string): Promise<ExamSummaryStats> {
    const response = await api.get<unknown>('/v1/exams/summary')
    const d = (response.data && typeof response.data === 'object' ? response.data : {}) as Record<string, unknown>
    return {
      total_completed: Number(d.total_completed ?? 0),
      this_week_count: Number(d.this_week_count ?? 0),
      avg_net: Number(d.avg_net ?? 0),
      best_net: Number(d.best_net ?? 0),
      avg_time_seconds: Number(d.avg_time_seconds ?? 0),
    }
  },

  async answerExamQuestion(_tokenOrId?: string | number, idOrData?: number | ExamAnswerPayload, data?: ExamAnswerPayload): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : (typeof idOrData === 'number' ? idOrData : undefined)
    const actualData = typeof _tokenOrId === 'number' ? (idOrData as ExamAnswerPayload) : data
    await api.post(`/v1/exams/${actualId}/answer`, actualData)
  },

  async finishExam(_tokenOrId?: string | number, id?: number): Promise<ExamSession> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    const response = await api.post<unknown>(`/v1/exams/${actualId}/finish`)
    return normalizeExamSessionFromApi(response.data)
  },

  async getExamResult(_tokenOrId?: string | number, id?: number | string): Promise<ExamSession> {
    const actualId = typeof _tokenOrId === 'string' && id !== undefined ? id : (typeof _tokenOrId === 'number' ? _tokenOrId : id)
    const response = await api.get<unknown>(`/v1/exams/${actualId}/result`)
    return normalizeExamSessionFromApi(response.data)
  },
}

// ─── Question API ────────────────────────────────────────────────────────────
export type QuestionListParams = {
  subject?: string
  difficulty?: string
  topic_id?: number
  /** Metin araması — backend `question_text` LIKE */
  q?: string
  /** Kazanım kodu — tam eşleşme */
  kazanim_code?: string
  page?: number
  per_page?: number
  exam_type?: string
}

export const questionApi = {
  async getQuestions(
    _tokenOrParams?: string | QuestionListParams,
    params?: QuestionListParams
  ): Promise<PaginatedResponse<Question>> {
    const actualParams = typeof _tokenOrParams === 'string' ? params : _tokenOrParams
    const response = await api.get<unknown>('/questions', { params: actualParams })
    const raw = response.data
    if (Array.isArray(raw)) return { data: raw as Question[], current_page: 1, last_page: 1, per_page: 20, total: (raw as Question[]).length }
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) return raw as PaginatedResponse<Question>
    return { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0 }
  },

  async answerQuestion(
    _tokenOrData?: string | { question_id: number; answer: string; time_spent?: number },
    data?: { question_id: number; answer: string; time_spent?: number }
  ): Promise<AnswerResult & { selected?: string; correct_option?: string }> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<Record<string, unknown>>('/questions/answer', actualData)
    const d = response.data ?? {}
    const isCorrect = Boolean(d.is_correct ?? d.correct)
    return {
      is_correct: isCorrect,
      correct: isCorrect,
      correct_option: typeof d.correct_option === 'string' ? d.correct_option : undefined,
      explanation: typeof d.explanation === 'string' ? d.explanation : undefined,
      solution_video: typeof d.solution_video === 'string' ? d.solution_video : undefined,
    }
  },

  async getBankSummary(_token?: string): Promise<QuestionBankSummary | null> {
    const response = await api.get<{ success?: boolean; data?: QuestionBankSummary }>('/questions/bank-summary')
    const raw = response.data as Record<string, unknown> | undefined
    const inner =
      raw && typeof raw.data === 'object' && raw.data !== null
        ? (raw.data as QuestionBankSummary)
        : (raw as unknown as QuestionBankSummary | undefined)
    if (inner?.kpis && Array.isArray(inner.subjects) && Array.isArray(inner.exam_tabs)) {
      return inner
    }
    return null
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
/**
 * Legacy kurs kataloğu (GET /courses, /courses/{id}).
 * Öğrenci "Derslerim" deneyimi müfredat API’si üzerinden yürütülür (`curriculumApi`).
 * Bu modül yalnızca eski sayfalar veya yönetim akışları içindir; yeni içerik öğretmen tarafında
 * `teacherApi.uploadCurriculumContent` ile müfredat konusuna bağlanır.
 */
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

  /** Canlı ders listesi (yaklaşan / geçmiş / tümü). GET /student/live-lessons */
  async getStudentLiveLessons(_tokenOrScope?: string, scope: 'upcoming' | 'past' | 'all' = 'upcoming'): Promise<TeacherLesson[]> {
    const actualScope =
      _tokenOrScope === 'upcoming' || _tokenOrScope === 'past' || _tokenOrScope === 'all' ? _tokenOrScope : scope
    const response = await api.get<unknown>('/student/live-lessons', { params: { scope: actualScope } })
    return normalizeArray<TeacherLesson>(response.data)
  },

  async getStudentLiveLessonsSummary(_token?: string): Promise<StudentLiveLessonsSummary> {
    const response = await api.get<{ success?: boolean; data?: StudentLiveLessonsSummary }>('/student/live-lessons/summary')
    const d = response.data as Record<string, unknown>
    const inner = d.data as StudentLiveLessonsSummary | undefined
    if (inner && typeof inner === 'object') return inner
    return { upcoming_this_week: 0, joined_this_month: 0, minutes_this_month: 0 }
  },

  /** Canlı derse katıl — P2P video araması için `getVideoRoom` kullanılır; `lesson_id` canlı dersde desteklenmez. */
  async joinLiveSession(sessionId: number): Promise<VideoRoom> {
    const response = await api.post<{ success?: boolean; data?: { room_url?: string; session_id?: number } }>(
      `/student/live-sessions/${sessionId}/join`,
    )
    const raw = response.data as Record<string, unknown>
    const inner = (raw.data ?? raw) as Record<string, unknown>
    const room_url = (inner.room_url as string) || ''
    if (!room_url) throw new Error('Oda bağlantısı alınamadı')
    return {
      room_url,
      session_id: String(inner.session_id ?? sessionId),
    }
  },

  async setLiveLessonReminder(
    sessionId: number,
    body: { remind_at: string; channel?: 'in_app' | 'push' | 'email' },
  ): Promise<void> {
    await api.post(`/student/live-sessions/${sessionId}/reminder`, {
      remind_at: body.remind_at,
      channel: body.channel ?? 'in_app',
    })
  },

  async generateParentCode(_token?: string): Promise<{ code: string }> {
    const response = await api.post<{ code: string }>('/student/generate-parent-code')
    return response.data
  },

  async getGoalEngine(_token?: string): Promise<unknown> {
    const response = await api.get<unknown>('/student/goal-engine')
    return response.data
  },

  async getStudentGoalDashboard(_token?: string): Promise<StudentGoalDashboard> {
    const response = await api.get<StudentGoalDashboard>('/student/goal-dashboard')
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
    const dash = await studentApi.getStudentGoalDashboard()
    return mapDashboardToLegacyGoalAnalysis(dash)
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

  async getClassExamSummary(_tokenOrId?: string | number, classId?: number): Promise<TeacherClassExamSummaryRow[]> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : classId
    const response = await api.get<unknown>(`/teacher/classes/${actualId}/exam-summary`)
    return normalizeArray<TeacherClassExamSummaryRow>(response.data)
  },

  async assignClassPlanTasks(
    classId: number,
    body: {
      plan_date: string
      tasks: Array<{
        title: string
        type?: string
        subject?: string
        planned_minutes?: number
        priority?: string
        kazanim_code?: string
      }>
      student_ids?: number[]
      client_batch_id?: string
    },
  ): Promise<{ teacher_batch_id: string; students_affected: number; tasks_created: number }> {
    const response = await api.post<{ success: boolean; teacher_batch_id: string; students_affected: number; tasks_created: number }>(
      `/teacher/classes/${classId}/plan-tasks`,
      body,
    )
    return response.data
  },

  async getTeacherStudentGoalDashboard(_tokenOrId?: string | number, studentId?: number): Promise<StudentGoalDashboard> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : studentId
    if (actualId === undefined) throw new Error('Öğrenci ID gerekli')
    const response = await api.get<StudentGoalDashboard>(`/teacher/students/${actualId}/goal-dashboard`)
    return response.data
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

  async createLiveSession(
    _tokenOrData?: string | {
      title: string
      class_id?: number
      class_room_id?: number
      starts_at?: string
      scheduled_at?: string
      duration_minutes?: number
      is_public?: boolean
      subject_tag?: string
      description?: string
      max_participants?: number
    },
    data?: {
      title: string
      class_id?: number
      class_room_id?: number
      starts_at?: string
      scheduled_at?: string
      duration_minutes?: number
      is_public?: boolean
      subject_tag?: string
      description?: string
      max_participants?: number
    },
  ): Promise<LiveSession> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ session: LiveSession }>('/teacher/live-sessions', actualData)
    return response.data.session ?? (response.data as unknown as LiveSession)
  },

  async getLiveSession(_tokenOrId?: string | number, sessionId?: number): Promise<LiveSession> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : sessionId
    if (actualId === undefined) throw new Error('Oturum ID gerekli')
    const response = await api.get<{ success?: boolean; data?: LiveSession }>(`/teacher/live-sessions/${actualId}`)
    const d = response.data as Record<string, unknown>
    return (d.data ?? response.data) as LiveSession
  },

  async goLiveSession(sessionId: number): Promise<LiveSession> {
    const response = await api.patch<{ success?: boolean; data?: LiveSession }>(`/teacher/live-sessions/${sessionId}/go-live`)
    const d = response.data as Record<string, unknown>
    return (d.data ?? response.data) as LiveSession
  },

  async endLiveSession(sessionId: number, body?: { recording_url?: string | null }): Promise<LiveSession> {
    const response = await api.patch<{ success?: boolean; data?: LiveSession }>(`/teacher/live-sessions/${sessionId}/end`, body ?? {})
    const d = response.data as Record<string, unknown>
    return (d.data ?? response.data) as LiveSession
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

  // P2P görüşme — canlı ders için `joinLiveSession` kullanın (`lesson_id` desteklenmez).
  async getVideoRoom(_tokenOrId?: string | number, lessonId?: number): Promise<VideoRoom | null> {
    try {
      const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : lessonId
      const response = await api.post<VideoRoom>(`/video-call/start`, { lesson_id: actualId })
      return response.data
    } catch {
      return null
    }
  },

  /** Müfredat konusu araması (içerik yükleme seçici). GET /teacher/curriculum/topics */
  async searchCurriculumTopics(
    q: string,
    limitOrOptions: number | SearchCurriculumTopicsOptions = 40,
  ): Promise<TeacherCurriculumTopicRow[]> {
    const options: SearchCurriculumTopicsOptions =
      typeof limitOrOptions === 'number' ? { limit: limitOrOptions } : limitOrOptions ?? {}
    const limit = Math.min(80, Math.max(5, options.limit ?? 40))
    const params: Record<string, string | number> = { q: q.trim(), limit }
    const g = options.grade?.trim()
    if (g && g !== 'all') {
      params.grade = g
    }
    const e = options.exam_type?.trim()
    if (e && e !== 'all') {
      params.exam_type = e
    }
    const response = await api.get<{ success?: boolean; topics?: TeacherCurriculumTopicRow[] }>('/teacher/curriculum/topics', {
      params,
    })
    const topics = response.data?.topics
    return Array.isArray(topics) ? topics : []
  },

  /** Video/PDF’yi müfredat konusuna bağlar. POST /teacher/curriculum-content (multipart) */
  async uploadCurriculumContent(formData: FormData): Promise<TeacherCurriculumUploadResponse> {
    const response = await api.post<TeacherCurriculumUploadResponse>('/teacher/curriculum-content', formData)
    return response.data
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

  async getChildLiveLessons(
    childId: number,
    scope: 'upcoming' | 'past' | 'all' = 'upcoming',
  ): Promise<TeacherLesson[]> {
    const response = await api.get<unknown>(`/parent/children/${childId}/live-lessons`, { params: { scope } })
    return normalizeArray<TeacherLesson>(response.data)
  },

  async getChildExams(_tokenOrId?: string | number, childId?: number): Promise<ExamSession[]> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : childId
    if (actualId === undefined) throw new Error('Öğrenci ID gerekli')
    const response = await api.get<unknown>(`/parent/children/${actualId}/exams`)
    return normalizeArray<ExamSession>(response.data)
  },

  async linkChild(_tokenOrCode?: string, code?: string): Promise<void> {
    const actualCode = code ?? _tokenOrCode
    await api.post('/parent/link', { invite_code: actualCode })
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

  async getAdminQuestions(
    _tokenOrParams?: string | { page?: number; subject?: string; search?: string; difficulty?: string },
    params?: { page?: number; subject?: string; search?: string; difficulty?: string }
  ): Promise<PaginatedResponse<Question>> {
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

  async bulkCreateAdminQuestions(
    questions: Array<Record<string, unknown>>
  ): Promise<{ created_ids: number[]; created_count: number; errors: unknown[] }> {
    const response = await api.post<{ created_ids: number[]; created_count: number; errors: unknown[] }>(
      '/admin/questions/bulk',
      { questions }
    )
    return response.data
  },

  async getQuestionBankDisplays(_token?: string): Promise<QuestionBankDisplayRow[]> {
    const response = await api.get<{ success?: boolean; data?: QuestionBankDisplayRow[] }>('/admin/question-bank-displays')
    const body = response.data
    return Array.isArray(body?.data) ? body.data : []
  },

  async createQuestionBankDisplay(_tokenOrData?: string | QuestionBankDisplayInput, data?: QuestionBankDisplayInput): Promise<QuestionBankDisplayRow> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    const response = await api.post<{ success?: boolean; data: QuestionBankDisplayRow }>('/admin/question-bank-displays', actualData)
    return response.data.data
  },

  async updateQuestionBankDisplay(
    id: number,
    data: Partial<QuestionBankDisplayInput>
  ): Promise<QuestionBankDisplayRow> {
    const response = await api.patch<{ success?: boolean; data: QuestionBankDisplayRow }>(`/admin/question-bank-displays/${id}`, data)
    return response.data.data
  },

  async deleteQuestionBankDisplay(_tokenOrId?: string | number, id?: number): Promise<void> {
    const actualId = typeof _tokenOrId === 'number' ? _tokenOrId : id
    await api.delete(`/admin/question-bank-displays/${actualId}`)
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

  async getAdminSettings(): Promise<{ language: string; maintenance_mode: boolean }> {
    const response = await api.get<{ success?: boolean; data?: { language?: string; maintenance_mode?: boolean } }>(
      '/admin/settings'
    )
    const d = response.data?.data
    return {
      language: d?.language === 'en' ? 'en' : 'tr',
      maintenance_mode: Boolean(d?.maintenance_mode),
    }
  },

  async updateAdminSettings(_tokenOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): Promise<void> {
    const actualData = typeof _tokenOrData === 'string' ? data : _tokenOrData
    await api.post('/admin/settings', actualData)
  },

  async getExamTemplates(params?: { active_only?: boolean; exam_type?: string }): Promise<ExamTemplateAdminRow[]> {
    const response = await api.get<{ success?: boolean; data?: ExamTemplateAdminRow[] }>('/admin/exam-templates', {
      params: {
        active_only: params?.active_only ? 1 : undefined,
        exam_type: params?.exam_type,
      },
    })
    const body = response.data
    return Array.isArray(body?.data) ? body.data : []
  },

  async getExamTemplateDetail(id: number): Promise<{ template: ExamTemplateAdminRow; questions: ExamTemplateQuestionRow[] }> {
    const response = await api.get<{
      success?: boolean
      data?: ExamTemplateAdminRow
      questions?: ExamTemplateQuestionRow[]
    }>(`/admin/exam-templates/${id}`)
    const body = response.data
    return {
      template: body.data as ExamTemplateAdminRow,
      questions: Array.isArray(body.questions) ? body.questions : [],
    }
  },

  async createExamTemplate(data: {
    title: string
    slug?: string
    exam_type: string
    grade?: number | null
    duration_minutes?: number
    description?: string | null
    is_active?: boolean
    sort_order?: number
  }): Promise<ExamTemplateAdminRow> {
    const response = await api.post<{ success?: boolean; data: ExamTemplateAdminRow }>('/admin/exam-templates', data)
    return response.data.data
  },

  async updateExamTemplate(id: number, data: Partial<ExamTemplateAdminRow> & { published_at?: string | null }): Promise<ExamTemplateAdminRow> {
    const response = await api.patch<{ success?: boolean; data: ExamTemplateAdminRow }>(`/admin/exam-templates/${id}`, data)
    return response.data.data
  },

  async deleteExamTemplate(id: number): Promise<void> {
    await api.delete(`/admin/exam-templates/${id}`)
  },

  async syncExamTemplateQuestions(
    id: number,
    questions: Array<{ question_id: number; section?: string | null }>
  ): Promise<ExamTemplateAdminRow> {
    const response = await api.put<{ success?: boolean; data: ExamTemplateAdminRow }>(`/admin/exam-templates/${id}/questions`, {
      questions,
    })
    return response.data.data
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
  async getCurriculum(grade?: string | number, examType?: string): Promise<{ subjects: CurriculumSubject[]; grade: string; exam_type: string }> {
    const params: Record<string, string> = {}
    if (grade != null && grade !== "") params.grade = String(grade)
    if (examType) params.exam_type = examType
    try {
      const response = await api.get<{ subjects: CurriculumSubject[]; grade: string; exam_type: string } | CurriculumSubject[]>('/curriculum', { params })
      const data = response.data
      // Backend { subjects: [...] } veya doğrudan [] dönebilir
      if (Array.isArray(data)) {
        return { subjects: data, grade: String(grade ?? ''), exam_type: examType ?? '' }
      }
      return {
        subjects: Array.isArray((data as Record<string, unknown>).subjects) ? (data as { subjects: CurriculumSubject[] }).subjects : [],
        grade: String(grade ?? ''),
        exam_type: examType ?? '',
      }
    } catch (e) {
      console.error('getCurriculum error:', e)
      return { subjects: [], grade: String(grade ?? ''), exam_type: examType ?? '' }
    }
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

  async getMediaCatalog(): Promise<MediaCatalogResponse | null> {
    try {
      const response = await api.get<MediaCatalogResponse>('/curriculum/media-catalog')
      return response.data
    } catch (e) {
      console.error('getMediaCatalog error:', e)
      return null
    }
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
  getPlanTemplates: planApi.getPlanTemplates.bind(planApi),
  addPlanTask: planApi.addPlanTask.bind(planApi),
  completeTask: planApi.completeTask.bind(planApi),
  deleteTask: planApi.deleteTask.bind(planApi),
  startStudySession: planApi.startStudySession.bind(planApi),
  endStudySession: planApi.endStudySession.bind(planApi),
  // Exam
  listExamTemplates: examApi.listExamTemplates.bind(examApi),
  startExam: examApi.startExam.bind(examApi),
  getExamHistory: examApi.getExamHistory.bind(examApi),
  getExamSummary: examApi.getExamSummary.bind(examApi),
  answerExamQuestion: examApi.answerExamQuestion.bind(examApi),
  finishExam: examApi.finishExam.bind(examApi),
  getExamResult: examApi.getExamResult.bind(examApi),
  // Questions
  getQuestions: questionApi.getQuestions.bind(questionApi),
  answerQuestion: questionApi.answerQuestion.bind(questionApi),
  getWeakAchievements: questionApi.getWeakAchievements.bind(questionApi),
  getSimilarQuestions: questionApi.getSimilarQuestions.bind(questionApi),
  generatePersonalTest: questionApi.generatePersonalTest.bind(questionApi),
  getBankSummary: questionApi.getBankSummary.bind(questionApi),
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
  getStudentLiveLessons: studentApi.getStudentLiveLessons.bind(studentApi),
  getStudentLiveLessonsSummary: studentApi.getStudentLiveLessonsSummary.bind(studentApi),
  joinLiveSession: studentApi.joinLiveSession.bind(studentApi),
  setLiveLessonReminder: studentApi.setLiveLessonReminder.bind(studentApi),
  generateParentCode: studentApi.generateParentCode.bind(studentApi),
  getGoalEngine: studentApi.getGoalEngine.bind(studentApi),
  getStudentGoalDashboard: studentApi.getStudentGoalDashboard.bind(studentApi),
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
  getClassExamSummary: teacherApi.getClassExamSummary.bind(teacherApi),
  assignClassPlanTasks: teacherApi.assignClassPlanTasks.bind(teacherApi),
  getTeacherStudentGoalDashboard: teacherApi.getTeacherStudentGoalDashboard.bind(teacherApi),
  getRiskStudents: teacherApi.getRiskStudents.bind(teacherApi),
  getTeacherAssignments: teacherApi.getTeacherAssignments.bind(teacherApi),
  createAssignment: teacherApi.createAssignment.bind(teacherApi),
  updateAssignment: teacherApi.updateAssignment.bind(teacherApi),
  deleteAssignment: teacherApi.deleteAssignment.bind(teacherApi),
  getLiveSessions: teacherApi.getLiveSessions.bind(teacherApi),
  createLiveSession: teacherApi.createLiveSession.bind(teacherApi),
  getLiveSession: teacherApi.getLiveSession.bind(teacherApi),
  goLiveSession: teacherApi.goLiveSession.bind(teacherApi),
  endLiveSession: teacherApi.endLiveSession.bind(teacherApi),
  getTeacherAnalytics: teacherApi.getTeacherAnalytics.bind(teacherApi),
  getTeacherMessages: teacherApi.getTeacherMessages.bind(teacherApi),
  sendMessage: teacherApi.sendMessage.bind(teacherApi),
  getVideoRoom: teacherApi.getVideoRoom.bind(teacherApi),
  searchCurriculumTopics: teacherApi.searchCurriculumTopics.bind(teacherApi),
  uploadCurriculumContent: teacherApi.uploadCurriculumContent.bind(teacherApi),
  // Parent
  getChildren: parentApi.getChildren.bind(parentApi),
  getChildSummary: parentApi.getChildSummary.bind(parentApi),
  getChildLiveLessons: parentApi.getChildLiveLessons.bind(parentApi),
  getChildExams: parentApi.getChildExams.bind(parentApi),
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
  bulkCreateAdminQuestions: adminApi.bulkCreateAdminQuestions.bind(adminApi),
  getQuestionBankDisplays: adminApi.getQuestionBankDisplays.bind(adminApi),
  createQuestionBankDisplay: adminApi.createQuestionBankDisplay.bind(adminApi),
  updateQuestionBankDisplay: adminApi.updateQuestionBankDisplay.bind(adminApi),
  deleteQuestionBankDisplay: adminApi.deleteQuestionBankDisplay.bind(adminApi),
  getExamTemplates: adminApi.getExamTemplates.bind(adminApi),
  getExamTemplateDetail: adminApi.getExamTemplateDetail.bind(adminApi),
  createExamTemplate: adminApi.createExamTemplate.bind(adminApi),
  updateExamTemplate: adminApi.updateExamTemplate.bind(adminApi),
  deleteExamTemplate: adminApi.deleteExamTemplate.bind(adminApi),
  syncExamTemplateQuestions: adminApi.syncExamTemplateQuestions.bind(adminApi),
  getPendingTeachers: adminApi.getPendingTeachers.bind(adminApi),
  approveTeacher: adminApi.approveTeacher.bind(adminApi),
  rejectTeacher: adminApi.rejectTeacher.bind(adminApi),
  getAdminCoupons: adminApi.getAdminCoupons.bind(adminApi),
  createAdminCoupon: adminApi.createAdminCoupon.bind(adminApi),
  updateAdminCoupon: adminApi.updateAdminCoupon.bind(adminApi),
  deleteAdminCoupon: adminApi.deleteAdminCoupon.bind(adminApi),
  getAdminSettings: adminApi.getAdminSettings.bind(adminApi),
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
  getMediaCatalog: curriculumApi.getMediaCatalog.bind(curriculumApi),
})

// ═══════════════════════════════════════════════════════════════════════════════
// Video Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  return null;
}

/**
 * Extract Vimeo video ID from URL
 */
export function extractVimeoId(url: string): string | null {
  const pattern = /vimeo\.com\/(\d+)/;
  const match = url.match(pattern);
  return match?.[1] || null;
}

/**
 * Get video thumbnail URL (YouTube, Vimeo, or fallback)
 */
export function getVideoThumbnail(url: string | null, thumbnailUrl?: string | null): string | null {
  // 1. Use provided thumbnail if available
  if (thumbnailUrl) return thumbnailUrl;
  
  // 2. No URL provided
  if (!url) return null;
  
  // 3. Extract YouTube thumbnail (hqdefault: backend ile aynı, yaygın ve stabil)
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = extractYouTubeId(url);
    if (id) {
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }
  }
  
  // 4. Extract Vimeo thumbnail (requires API call, return null for now)
  if (url.includes('vimeo.com')) {
    const id = extractVimeoId(url);
    if (id) {
      // Vimeo thumbnails require API call, use placeholder
      return `https://vumbnail.com/${id}.jpg`;
    }
  }
  
  return null;
}

/**
 * Check if URL is a video streaming service
 */
export function isStreamingVideo(url: string | null): boolean {
  if (!url) return false;
  return url.includes('youtube.com') || 
         url.includes('youtu.be') || 
         url.includes('vimeo.com');
}

export default api

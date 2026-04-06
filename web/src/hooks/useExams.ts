import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import toast from 'react-hot-toast'

// Types
export interface Exam {
  id: number
  title: string
  description?: string
  exam_type: 'tyt' | 'ayt' | 'lgs' | 'custom'
  duration_minutes: number
  question_count: number
  subjects: string[]
  is_active: boolean
}

export interface ExamSession {
  id: number
  exam_id: number
  user_id: number
  status: 'started' | 'in_progress' | 'completed' | 'abandoned'
  started_at: string
  completed_at?: string
  total_questions: number
  answered_questions: number
  correct_answers: number
  incorrect_answers: number
  empty_answers: number
  score?: number
  net_score?: number
}

export interface ExamQuestion {
  id: number
  question_id: number
  exam_session_id: number
  order: number
  selected_option_id?: number
  is_correct?: boolean
  time_spent_seconds?: number
  marked_for_review: boolean
  question: any
}

// Query Keys
export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  detail: (id: number) => [...examKeys.all, 'detail', id] as const,
  sessions: () => [...examKeys.all, 'sessions'] as const,
  session: (id: number) => [...examKeys.sessions(), id] as const,
  sessionQuestions: (sessionId: number) => [...examKeys.session(sessionId), 'questions'] as const,
  userSessions: () => [...examKeys.sessions(), 'user'] as const,
}

// Hooks

/**
 * Get all exams
 */
export function useExams() {
  return useQuery({
    queryKey: examKeys.lists(),
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: Exam[] }>('/exams')
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Get exam detail
 */
export function useExam(examId: number) {
  return useQuery({
    queryKey: examKeys.detail(examId),
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: Exam }>(`/exams/${examId}`)
      return response.data
    },
    enabled: !!examId,
  })
}

/**
 * Start exam session
 */
export function useStartExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (examId: number) => {
      const response = await apiPost<{
        success: boolean
        session: ExamSession
      }>(`/exams/${examId}/start`)
      return response
    },
    onSuccess: (data) => {
      toast.success('Deneme başlatıldı!')
      queryClient.invalidateQueries({ queryKey: examKeys.sessions() })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Deneme başlatılamadı'
      toast.error(message)
    },
  })
}

/**
 * Get exam session
 */
export function useExamSession(sessionId: number) {
  return useQuery({
    queryKey: examKeys.session(sessionId),
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: ExamSession }>(
        `/exam-sessions/${sessionId}`
      )
      return response.data
    },
    enabled: !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (query) => {
      // Auto-refresh if exam is in progress
      const session = query.state.data
      return session?.status === 'in_progress' ? 30000 : false
    },
  })
}

/**
 * Get exam session questions
 */
export function useExamQuestions(sessionId: number) {
  return useQuery({
    queryKey: examKeys.sessionQuestions(sessionId),
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: ExamQuestion[] }>(
        `/exam-sessions/${sessionId}/questions`
      )
      return response.data
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Submit exam answer
 */
export function useSubmitExamAnswer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      session_id: number
      question_id: number
      selected_option_id?: number
      time_spent_seconds: number
      marked_for_review?: boolean
    }) => {
      const response = await apiPost<{
        success: boolean
        is_correct: boolean
      }>(`/exam-sessions/${data.session_id}/answer`, data)
      return response
    },
    onSuccess: (data, variables) => {
      // Update session and questions cache
      queryClient.invalidateQueries({ queryKey: examKeys.session(variables.session_id) })
      queryClient.invalidateQueries({
        queryKey: examKeys.sessionQuestions(variables.session_id),
      })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Cevap kaydedilemedi'
      toast.error(message)
    },
  })
}

/**
 * Complete exam session
 */
export function useCompleteExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiPost<{
        success: boolean
        session: ExamSession
      }>(`/exam-sessions/${sessionId}/complete`)
      return response
    },
    onSuccess: (data) => {
      toast.success('Deneme tamamlandı!')
      queryClient.invalidateQueries({ queryKey: examKeys.sessions() })
      queryClient.invalidateQueries({ queryKey: examKeys.session(data.session.id) })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Deneme tamamlanamadı'
      toast.error(message)
    },
  })
}

/**
 * Get user's exam sessions
 */
export function useUserExamSessions() {
  return useQuery({
    queryKey: examKeys.userSessions(),
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: ExamSession[] }>(
        '/exam-sessions/my'
      )
      return response.data
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Abandon exam session
 */
export function useAbandonExam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiPost<{ success: boolean }>(
        `/exam-sessions/${sessionId}/abandon`
      )
      return response
    },
    onSuccess: (data, sessionId) => {
      toast.success('Deneme iptal edildi')
      queryClient.invalidateQueries({ queryKey: examKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: examKeys.sessions() })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'İptal edilemedi'
      toast.error(message)
    },
  })
}

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import toast from 'react-hot-toast'

// Types
export interface Question {
  id: number
  subject: string
  topic_id?: number
  achievement_code?: string
  difficulty: 'kolay' | 'orta' | 'zor'
  question_text: string
  question_image?: string
  options: QuestionOption[]
  correct_answer_id: number
  explanation?: string
  video_solution_url?: string
}

export interface QuestionOption {
  id: number
  option_text: string
  option_image?: string
}

export interface QuestionAnswer {
  id: number
  question_id: number
  user_id: number
  selected_option_id: number
  is_correct: boolean
  time_spent_seconds: number
  created_at: string
}

// Query Keys
export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...questionKeys.lists(), filters] as const,
  detail: (id: number) => [...questionKeys.all, 'detail', id] as const,
  random: (filters?: Record<string, any>) => [...questionKeys.all, 'random', filters] as const,
  statistics: (userId?: number) => [...questionKeys.all, 'statistics', userId] as const,
}

// Hooks

/**
 * Get questions (with filters)
 */
export function useQuestions(filters?: {
  subject?: string
  difficulty?: string
  topic_id?: number
  achievement_code?: string
  limit?: number
}) {
  return useQuery({
    queryKey: questionKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.subject) params.append('subject', filters.subject)
      if (filters?.difficulty) params.append('difficulty', filters.difficulty)
      if (filters?.topic_id) params.append('topic_id', filters.topic_id.toString())
      if (filters?.achievement_code) params.append('achievement_code', filters.achievement_code)
      if (filters?.limit) params.append('limit', filters.limit.toString())

      const response = await apiGet<{ success: boolean; data: Question[] }>(
        `/questions?${params.toString()}`
      )
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get random questions (infinite scroll for practice mode)
 */
export function useInfiniteQuestions(filters?: {
  subject?: string
  difficulty?: string
  achievement_code?: string
}) {
  return useInfiniteQuery({
    queryKey: questionKeys.random(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams()
      if (filters?.subject) params.append('subject', filters.subject)
      if (filters?.difficulty) params.append('difficulty', filters.difficulty)
      if (filters?.achievement_code) params.append('achievement_code', filters.achievement_code)
      params.append('page', pageParam.toString())
      params.append('limit', '10')

      const response = await apiGet<{
        success: boolean
        data: Question[]
        meta: { current_page: number; last_page: number }
      }>(`/questions?${params.toString()}`)
      return response
    },
    getNextPageParam: (lastPage) => {
      const { current_page, last_page } = lastPage.meta
      return current_page < last_page ? current_page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Submit question answer
 */
export function useSubmitAnswer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      question_id: number
      selected_option_id: number
      time_spent_seconds: number
    }) => {
      const response = await apiPost<{
        success: boolean
        is_correct: boolean
        correct_answer_id: number
        explanation?: string
        answer: QuestionAnswer
      }>(`/questions/${data.question_id}/answer`, data)
      return response
    },
    onSuccess: (data) => {
      if (data.is_correct) {
        toast.success('Doğru cevap! 🎉')
      } else {
        toast.error('Yanlış cevap 😔')
      }
      // Invalidate statistics
      queryClient.invalidateQueries({ queryKey: questionKeys.statistics() })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Cevap gönderilemedi'
      toast.error(message)
    },
  })
}

/**
 * Get question statistics
 */
export function useQuestionStatistics(userId?: number) {
  return useQuery({
    queryKey: questionKeys.statistics(userId),
    queryFn: async () => {
      const url = userId ? `/questions/statistics/${userId}` : '/questions/statistics'
      const response = await apiGet<{
        success: boolean
        data: {
          total_answered: number
          correct_count: number
          incorrect_count: number
          accuracy_rate: number
          average_time_seconds: number
          by_subject: Record<string, any>
          by_difficulty: Record<string, any>
        }
      }>(url)
      return response.data
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Get question detail
 */
export function useQuestion(questionId: number) {
  return useQuery({
    queryKey: questionKeys.detail(questionId),
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: Question }>(
        `/questions/${questionId}`
      )
      return response.data
    },
    enabled: !!questionId,
  })
}

/**
 * Report question
 */
export function useReportQuestion() {
  return useMutation({
    mutationFn: async (data: { question_id: number; reason: string; description?: string }) => {
      const response = await apiPost<{ success: boolean; message: string }>(
        '/questions/report',
        data
      )
      return response
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Soru bildirildi. Teşekkürler!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Bildirme başarısız'
      toast.error(message)
    },
  })
}

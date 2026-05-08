/**
 * @deprecated Bu hook eski REST sözleşmesine göre yazılmıştı. Öğrenci soru bankası için
 * `api` / `questionApi` (`@/lib/api`) ve `ogrenci/soru-bankasi` sayfasındaki akışı kullanın.
 * Geriye dönük uyumluluk için temel çağrılar Laravel uçlarıyla hizalanmıştır; yeni özellik
 * eklemeyin.
 */
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { questionApi } from '@/lib/api'
import type { QuestionListParams } from '@/lib/api'
import toast from 'react-hot-toast'

export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...questionKeys.lists(), filters] as const,
  bankSummary: () => [...questionKeys.all, 'bank-summary'] as const,
}

export function useQuestions(filters?: QuestionListParams) {
  return useQuery({
    queryKey: questionKeys.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const res = await questionApi.getQuestions(filters ?? {})
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useInfiniteQuestions(filters?: Pick<QuestionListParams, 'subject' | 'difficulty' | 'kazanim_code'>) {
  return useInfiniteQuery({
    queryKey: [...questionKeys.all, 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await questionApi.getQuestions({
        ...filters,
        page: pageParam,
        per_page: 10,
      })
      return res
    },
    getNextPageParam: (lastPage) => {
      const cur = lastPage.current_page ?? 1
      const last = lastPage.last_page ?? 1
      return cur < last ? cur + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
  })
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { question_id: number; answer: string; time_spent?: number }) => {
      return questionApi.answerQuestion(data)
    },
    onSuccess: (data) => {
      if (data.is_correct) toast.success('Doğru cevap!')
      else toast.error('Yanlış cevap')
      void queryClient.invalidateQueries({ queryKey: questionKeys.bankSummary() })
    },
    onError: () => {
      toast.error('Cevap gönderilemedi')
    },
  })
}

export function useQuestionBankSummary() {
  return useQuery({
    queryKey: questionKeys.bankSummary(),
    queryFn: () => questionApi.getBankSummary(),
    staleTime: 60 * 1000,
  })
}

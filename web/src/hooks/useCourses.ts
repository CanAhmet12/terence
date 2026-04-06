import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'
import toast from 'react-hot-toast'

// Types
export interface Course {
  id: number
  title: string
  subject: string
  level: string
  grade?: string
  exam_type?: string
  description?: string
  is_active: boolean
  sort_order: number
  units?: Unit[]
  completion_percentage?: number
  is_enrolled?: boolean
}

export interface Unit {
  id: number
  course_id: number
  title: string
  sort_order: number
  topics?: Topic[]
}

export interface Topic {
  id: number
  unit_id: number
  title: string
  sort_order: number
  contentItems?: ContentItem[]
}

export interface ContentItem {
  id: number
  topic_id: number
  title: string
  type: 'video' | 'pdf' | 'quiz' | 'text'
  content_url?: string
  duration_minutes?: number
  sort_order: number
  progress_status?: 'not_started' | 'in_progress' | 'completed'
}

// Query Keys
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: number) => [...courseKeys.details(), id] as const,
  progress: (courseId: number) => [...courseKeys.all, 'progress', courseId] as const,
}

// Hooks

/**
 * Get all courses
 */
export function useCourses(filters?: { subject?: string; exam_type?: string; grade?: string }) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.subject) params.append('subject', filters.subject)
      if (filters?.exam_type) params.append('exam_type', filters.exam_type)
      if (filters?.grade) params.append('grade', filters.grade)

      const response = await apiGet<{ success: boolean; data: Course[] }>(
        `/courses?${params.toString()}`
      )
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Get course detail
 */
export function useCourse(courseId: number) {
  return useQuery({
    queryKey: courseKeys.detail(courseId),
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; data: Course }>(`/courses/${courseId}`)
      return response.data
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get course progress
 */
export function useCourseProgress(courseId: number) {
  return useQuery({
    queryKey: courseKeys.progress(courseId),
    queryFn: async () => {
      const response = await apiGet<{
        success: boolean
        enrolled: boolean
        completion_percentage: number
        enrolled_at?: string
      }>(`/courses/${courseId}/progress`)
      return response
    },
    enabled: !!courseId,
    staleTime: 30 * 1000, // 30 seconds (frequently updated)
  })
}

/**
 * Enroll in course
 */
export function useEnrollCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiPost<{
        success: boolean
        message: string
        enrollment: any
      }>(`/courses/${courseId}/enroll`)
      return response
    },
    onSuccess: (data, courseId) => {
      toast.success(data.message || 'Kursa kaydolundu!')
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) })
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.progress(courseId) })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Kayıt başarısız'
      toast.error(message)
    },
  })
}

/**
 * Update content progress
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      content_item_id: number
      status: 'in_progress' | 'completed'
      watch_seconds?: number
      marked_understood?: boolean
      needs_repeat?: boolean
    }) => {
      const response = await apiPost<{
        success: boolean
        progress: any
      }>('/progress', data)
      return response
    },
    onSuccess: (data, variables) => {
      // Invalidate course detail and progress
      queryClient.invalidateQueries({ queryKey: courseKeys.details() })
      queryClient.invalidateQueries({ queryKey: courseKeys.all })
      toast.success('İlerleme kaydedildi!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'İlerleme kaydedilemedi'
      toast.error(message)
    },
  })
}

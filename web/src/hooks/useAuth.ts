import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, setAccessToken, clearTokens } from '@/lib/api'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// Types
export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'teacher' | 'parent' | 'admin'
  profile_image?: string
}

export interface LoginCredentials {
  email: string
  password: string
  device_name?: string
  device_id?: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: 'student' | 'teacher' | 'parent'
  device_name?: string
  device_id?: string
}

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
}

// Hooks

/**
 * Get current user
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await apiGet<{ success: boolean; user: User }>('/auth/me')
      return response.user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })
}

/**
 * Login mutation
 */
export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiPost<{
        success: boolean
        access_token: string
        user: User
      }>('/v1/auth/login', credentials)
      return response
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token)
      queryClient.setQueryData(authKeys.me(), data.user)
      toast.success('Giriş başarılı!')
      router.push('/dashboard')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Giriş başarısız'
      toast.error(message)
    },
  })
}

/**
 * Register mutation
 */
export function useRegister() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiPost<{
        success: boolean
        access_token: string
        user: User
      }>('/v1/auth/register', data)
      return response
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token)
      queryClient.setQueryData(authKeys.me(), data.user)
      toast.success('Kayıt başarılı! Hoş geldiniz!')
      router.push('/dashboard')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Kayıt başarısız'
      toast.error(message)
    },
  })
}

/**
 * Logout mutation
 */
export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiPost('/v1/auth/logout')
    },
    onSuccess: () => {
      clearTokens()
      queryClient.clear()
      toast.success('Çıkış yapıldı')
      router.push('/login')
    },
    onError: () => {
      // Even if API fails, clear local tokens
      clearTokens()
      queryClient.clear()
      router.push('/login')
    },
  })
}

/**
 * Refresh token mutation
 */
export function useRefreshToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiPost<{
        success: boolean
        access_token: string
      }>('/v1/auth/refresh')
      return response
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
    onError: () => {
      clearTokens()
      queryClient.clear()
    },
  })
}

/**
 * Change password mutation
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      current_password: string
      password: string
      password_confirmation: string
    }) => {
      const response = await apiPost<{ success: boolean; message: string }>(
        '/auth/change-password',
        data
      )
      return response
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Şifre değiştirildi')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Şifre değiştirme başarısız'
      toast.error(message)
    },
  })
}

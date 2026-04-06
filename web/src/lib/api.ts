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
  withCredentials: true, // For HttpOnly cookies (refresh token)
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = refreshResponse.data.access_token

        // Save new token
        setAccessToken(newAccessToken)

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      toast.error(`Çok fazla istek. ${retryAfter} saniye sonra tekrar deneyin.`)
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error('Bu işlem için yetkiniz yok.')
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      toast.error('Sunucu hatası. Lütfen daha sonra tekrar deneyin.')
    }

    return Promise.reject(error)
  }
)

// Token management
const TOKEN_KEY = 'access_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// API helper functions
export async function apiGet<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.get<T>(url, config)
  return response.data
}

export async function apiPost<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.post<T>(url, data, config)
  return response.data
}

export async function apiPut<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.put<T>(url, data, config)
  return response.data
}

export async function apiDelete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await api.delete<T>(url, config)
  return response.data
}

// Types
export interface User {
  id: number
  name: string
  email: string
  role: 'student' | 'teacher' | 'parent' | 'admin'
  phone?: string
  avatar?: string
  email_verified_at?: string | null
  grade?: number
  target_exam?: string
  target_school?: string
  target_department?: string
  target_net?: number
  subject?: string
  bio?: string
  created_at: string
  updated_at: string
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

// Auth API functions
export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/v1/auth/login', {
      email,
      password,
    })
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
    await api.post('/v1/auth/reset-password', {
      token,
      email,
      password,
      password_confirmation,
    })
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/v1/auth/verify-email', { token })
  },

  async resendVerification(email: string): Promise<void> {
    await api.post('/v1/auth/resend-verification', { email })
  },
}

// Re-export authApi methods on api object for backward compatibility
Object.assign(api, authApi)

// Export authApi separately for type safety
export { authApi }

export default api

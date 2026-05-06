"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, User, authApi, setAccessToken, clearTokens } from "./api";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: "student" | "teacher" | "parent";
    phone?: string;
    grade?: number;
    target_exam?: string;
    target_school?: string;
    target_department?: string;
    target_net?: number;
    subject?: string;
    bio?: string;
    child_email?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

// SECURITY FIX: Tokens no longer stored in localStorage (XSS protection)
// Access token stored in memory only (lost on refresh)
// Refresh token stored in HttpOnly cookie (immune to XSS)
const LOGOUT_EVENT_KEY = "logout_event";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // Initialize auth on mount using refresh token (HttpOnly cookie)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initAuth = async () => {
      try {
        // Try to refresh token using HttpOnly cookie
        const refreshed = await authApi.refresh();
        const newToken = refreshed.token.access_token;
        
        // Set in axios headers and state (memory only)
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setAccessToken(newToken);
        
        // Fetch user from server
        const user = await authApi.getMe();
        setState({ user, token: newToken, loading: false, error: null });
      } catch {
        // No valid refresh token or refresh failed - user not logged in
        setState({ user: null, token: null, loading: false, error: null });
      }
    };

    initAuth();
  }, []);

  // Listen for logout events in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOGOUT_EVENT_KEY) {
        // Another tab logged out - clear state here too
        delete api.defaults.headers.common['Authorization'];
        clearTokens();
        setState({ user: null, token: null, loading: false, error: null });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await authApi.login(email, password);
      const user = res.user as User;
      const token = res.token.access_token;
      
      // SECURITY FIX: Store token in memory only (no localStorage)
      setAccessToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setState({ user, token, loading: false, error: null });
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Giriş başarısız";
      setState((s) => ({ ...s, loading: false, error: translateError(raw) }));
      throw e;
    }
  }, []);

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      role: "student" | "teacher" | "parent";
      phone?: string;
      grade?: number;
      target_exam?: string;
      target_school?: string;
      target_department?: string;
      target_net?: number;
      subject?: string;
      bio?: string;
      child_email?: string;
    }) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await authApi.register(data);
        if (res.token && res.user) {
          const token = res.token.access_token;
          
          // SECURITY FIX: Store token in memory only (no localStorage)
          setAccessToken(token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          setState({ user: res.user, token, loading: false, error: null });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : "Kayıt başarısız";
        setState((s) => ({ ...s, loading: false, error: translateError(raw) }));
        throw e;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try { 
      await authApi.logout(); // Clears HttpOnly refresh token cookie
    } catch (e) {
      console.error('Logout API call failed:', e);
    }
    
    // Clear axios headers
    clearTokens();
    delete api.defaults.headers.common['Authorization'];
    
    // Clear state
    setState({ user: null, token: null, loading: false, error: null });
    
    // Clear any sessionStorage
    sessionStorage.clear();
    
    // Broadcast logout event to other tabs
    localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email);
  }, []);

  const updateUser = useCallback((user: User) => {
    // SECURITY FIX: Never store user in localStorage (client-side manipulation risk)
    // Only update in-memory state
    setState((s) => ({ ...s, user }));
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, forgotPassword, updateUser, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function translateError(msg: string): string {
  const map: Record<string, string> = {
    "Invalid credentials": "E-posta veya şifre hatalı.",
    "These credentials do not match our records": "E-posta veya şifre hatalı.",
    "INVALID_CREDENTIALS": "E-posta veya şifre hatalı.",
    Unauthorized: "Oturum süresi doldu. Lütfen tekrar giriş yapın.",
    "The email has already been taken": "Bu e-posta adresi zaten kayıtlı.",
    "The email field must be a valid email address": "Geçerli bir e-posta adresi girin.",
    "The password field must be at least 8 characters": "Şifre en az 8 karakter olmalıdır.",
    "Too Many Attempts": "Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.",
    "Server Error": "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
    "Network request failed": "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.",
    "Failed to fetch": "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.",
  };
  return map[msg] ?? msg;
}

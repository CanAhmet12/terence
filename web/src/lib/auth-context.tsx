"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, User, authApi } from "./api";

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

const TOKEN_KEY = "terence_token";
const USER_KEY  = "terence_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    // Set token in axios instance
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    authApi
      .getMe()
      .then((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState({ user, token, loading: false, error: null });
      })
      .catch(async () => {
        // Token geçersiz olabilir — refresh dene
        try {
          const refreshed = await authApi.refresh();
          const newToken = refreshed.token.access_token;
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          const user = await authApi.getMe();
          localStorage.setItem(TOKEN_KEY, newToken);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          setState({ user, token: newToken, loading: false, error: null });
        } catch {
          // Refresh da başarısız → oturumu kapat
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          delete api.defaults.headers.common['Authorization'];
          setState({ user: null, token: null, loading: false, error: null });
        }
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await authApi.login(email, password);
      const user = res.user as User;
      const token = res.token.access_token; // Extract access_token from token object
      
      // Save to localStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // Set token in axios instance immediately
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
          const token = res.token.access_token; // Extract access_token from token object
          
          // Save to localStorage
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          
          // Set token in axios instance immediately
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
      await authApi.logout(); 
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    setState({ user: null, token: null, loading: false, error: null });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authApi.forgotPassword(email);
  }, []);

  const updateUser = useCallback((user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
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

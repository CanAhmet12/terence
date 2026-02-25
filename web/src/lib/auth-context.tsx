"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, User } from "./api";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  loginDemo: (role: "student" | "teacher" | "admin" | "parent") => void;
  register: (data: { name: string; email: string; password: string; password_confirmation: string; role: "student" | "teacher" | "parent"; phone?: string; child_email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "terence_token";
const USER_KEY = "terence_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  const loadStored = useCallback(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      try {
        setState((s) => ({ ...s, token: t, user: JSON.parse(u), loading: false }));
        return;
      } catch {}
    }
    setState((s) => ({ ...s, loading: false }));
  }, []);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.login(email, password);
      const user = res.user as User;
      const token = res.token;
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      setState({ user, token, loading: false, error: null });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Giriş başarısız";
      setState((s) => ({ ...s, loading: false, error: msg }));
      throw e;
    }
  }, []);

  const loginDemo = useCallback((role: "student" | "teacher" | "admin" | "parent") => {
    const demoUsers: Record<string, User> = {
      student: { id: 1, name: "Demo Öğrenci", email: "demo@terence.com", role: "student" },
      teacher: { id: 2, name: "Demo Öğretmen", email: "demo@terence.com", role: "teacher" },
      admin: { id: 3, name: "Demo Admin", email: "admin@terence.com", role: "admin" },
      parent: { id: 4, name: "Demo Veli", email: "veli@terence.com", role: "parent" },
    };
    const demoUser = demoUsers[role] || demoUsers.student;
    const demoToken = "demo-token-" + role;
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, demoToken);
      localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    }
    setState({ user: demoUser, token: demoToken, loading: false, error: null });
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string; password_confirmation: string; role: "student" | "teacher" | "parent"; phone?: string; child_email?: string }) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        await api.register(data);
        setState((s) => ({ ...s, loading: false, error: null }));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Kayıt başarısız";
        setState((s) => ({ ...s, loading: false, error: msg }));
        throw e;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const t = state.token;
    if (t) {
      try {
        await api.logout(t);
      } catch {}
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setState({ user: null, token: null, loading: false, error: null });
  }, [state.token]);

  const forgotPassword = useCallback(async (email: string) => {
    await api.forgotPassword(email);
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginDemo,
        register,
        logout,
        forgotPassword,
        clearError,
      }}
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

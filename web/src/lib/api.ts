const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type FetchOptions = RequestInit & {
  token?: string | null;
};

async function fetchApi<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data?.error;
    const msg =
      data?.message ||
      (err && typeof err === "object" && "message" in err ? (err as { message: string }).message : null) ||
      (typeof err === "string" ? err : null) ||
      data?.code ||
      res.statusText;
    throw new Error(typeof msg === "string" ? msg : "İstek başarısız");
  }
  return data as T;
}

type AuthResponse = {
  success?: boolean;
  user: User;
  token: string | { access_token: string };
};

export const api = {
  async login(email: string, password: string) {
    const res = await fetchApi<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const token = typeof res.token === "string" ? res.token : res.token?.access_token;
    return { user: res.user, token };
  },
  async register(data: RegisterInput) {
    return fetchApi<{ user?: User; message?: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async logout(token: string) {
    return fetchApi("/auth/logout", { method: "POST", token });
  },
  async refresh(token: string) {
    return fetchApi<{ token: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
  async forgotPassword(email: string) {
    return fetchApi<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async getProfile(token: string) {
    return fetchApi<User>("/user", { token });
  },
  async getCategories() {
    return fetchApi<{ data: Category[] }>("/categories");
  },
  async getTeachers(params?: Record<string, string>) {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi<{ data: Teacher[] }>(`/teachers${q}`);
  },
  async contact(data: { name: string; email: string; konu: string; mesaj: string }) {
    return fetchApi<{ message?: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin" | string;
  profile_photo_url?: string;
  teacher_status?: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: "student" | "teacher" | "parent";
  phone?: string;
  child_email?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Teacher {
  id: number;
  user_id: number;
  user?: User;
  bio?: string;
  price_hour?: number;
  rating_avg?: number;
}

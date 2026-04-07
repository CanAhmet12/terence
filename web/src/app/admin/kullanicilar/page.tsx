"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, MoreVertical, UserCheck, UserX, Trash2, RefreshCw, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, User } from "@/lib/api";

type AdminUser = User & { is_active?: boolean; created_at?: string };

const ROLE_LABELS: Record<string, string> = {
  student: "Öğrenci",
  teacher: "Öğretmen",
  parent: "Veli",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-teal-100 text-teal-700",
  parent: "bg-purple-100 text-purple-700",
  admin: "bg-slate-700 text-white",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function AdminKullanicilarPage() {
  const { token } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUsers = useCallback(async (q: string, role: string, p: number) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminUsers({ search: q || undefined, role: role || undefined, page: p });
      const resObj = res as Record<string, unknown>;
      const usersData = Array.isArray((resObj as Record<string, unknown>).data) ? (resObj as Record<string, unknown>).data as AdminUser[] : Array.isArray(res) ? res as AdminUser[] : [];
      const meta = (resObj as Record<string, unknown>).meta as Record<string, number> | undefined;
      setUsers(usersData);
      setTotal(meta?.total ?? usersData.length);
      setLastPage(meta?.last_page ?? 1);
    } catch {
      setError("Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(search, roleFilter, page), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search, roleFilter, page, loadUsers]);

  const handleToggleStatus = async (user: AdminUser) => {
    if (!token) return;
    setActionLoading(user.id);
    setOpenMenuId(null);
    try {
      await api.toggleAdminUserStatus(user.id);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch {
      setError("Durum güncellenemedi.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!token) return;
    if (!confirm(`"${user.name}" kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz?`)) return;
    setActionLoading(user.id);
    setOpenMenuId(null);
    try {
      await api.deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setTotal((t) => t - 1);
    } catch {
      setError("Kullanıcı silinemedi.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kullanıcı Yönetimi</h1>
          <p className="text-slate-600 mt-1">
            {loading ? "Yükleniyor..." : `Toplam ${total} kullanıcı`}
          </p>
        </div>
        <button
          onClick={() => loadUsers(search, roleFilter, page)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline text-red-600 hover:text-red-800">Kapat</button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="İsim veya e-posta ara..."
            className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
        >
          <option value="">Tüm Roller</option>
          <option value="student">Öğrenci</option>
          <option value="teacher">Öğretmen</option>
          <option value="parent">Veli</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">Kullanıcı bulunamadı.</p>
            {(search || roleFilter) && (
              <button
                onClick={() => { setSearch(""); setRoleFilter(""); setPage(1); }}
                className="mt-3 text-sm text-teal-600 hover:underline"
              >
                Filtreleri temizle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Kullanıcı</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">E-posta</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Rol</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Durum</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-700">Kayıt</th>
                  <th className="w-12 p-4"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] ?? "bg-slate-100 text-slate-700"}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {u.is_active !== false ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="p-4 relative">
                      {actionLoading === u.id ? (
                        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : (
                        <>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                            aria-label={`${u.name} için işlemler`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === u.id && (
                            <div
                              className="absolute right-0 top-10 z-20 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]"
                              onMouseLeave={() => setOpenMenuId(null)}
                            >
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                {u.is_active !== false
                                  ? <><UserX className="w-4 h-4 text-amber-600" /> Pasife Al</>
                                  : <><UserCheck className="w-4 h-4 text-emerald-600" /> Aktife Al</>
                                }
                              </button>
                              <button
                                onClick={() => handleDelete(u)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Sil
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sayfalama */}
      {!loading && lastPage > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">{total} kullanıcıdan {users.length} gösteriliyor</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Önceki
            </button>
            <span className="px-4 py-2 text-sm font-semibold bg-teal-50 text-teal-700 rounded-lg">
              {page} / {lastPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

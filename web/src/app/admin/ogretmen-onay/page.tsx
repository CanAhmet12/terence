"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Search, RefreshCw, User, BookOpen, Clock, AlertCircle, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface TeacherApplicant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  bio?: string;
  teacher_status: "pending" | "approved" | "rejected";
  created_at: string;
  profile_photo_url?: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  return `${days} gün önce`;
}

export default function OgretmenOnayPage() {
  const { token } = useAuth();
  const [applicants, setApplicants] = useState<TeacherApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<TeacherApplicant | null>(null);

  const loadApplicants = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminUsers(token, {
        role: "teacher",
        teacher_status: filter === "all" ? undefined : filter,
        search: search || undefined,
        per_page: 50,
      });
      setApplicants(res.data as TeacherApplicant[]);
    } catch (e) {
      setError((e as Error).message || "Yüklenemedi.");
    }
    setLoading(false);
  }, [token, filter, search]);

  useEffect(() => {
    const t = setTimeout(loadApplicants, 300);
    return () => clearTimeout(t);
  }, [loadApplicants]);

  const handleApprove = async (id: number) => {
    if (!token) return;
    setProcessing(id);
    try {
      await api.updateAdminUser(token, id, { teacher_status: "approved" });
      setApplicants((prev) => prev.map((a) => a.id === id ? { ...a, teacher_status: "approved" } : a));
      if (selectedUser?.id === id) setSelectedUser((u) => u ? { ...u, teacher_status: "approved" } : null);
    } catch (e) {
      alert((e as Error).message || "İşlem başarısız.");
    }
    setProcessing(null);
  };

  const handleReject = async (id: number) => {
    if (!token) return;
    if (!confirm("Bu öğretmen başvurusunu reddetmek istediğinizden emin misiniz?")) return;
    setProcessing(id);
    try {
      await api.updateAdminUser(token, id, { teacher_status: "rejected" });
      setApplicants((prev) => prev.map((a) => a.id === id ? { ...a, teacher_status: "rejected" } : a));
      if (selectedUser?.id === id) setSelectedUser((u) => u ? { ...u, teacher_status: "rejected" } : null);
    } catch (e) {
      alert((e as Error).message || "İşlem başarısız.");
    }
    setProcessing(null);
  };

  const pendingCount = applicants.filter((a) => a.teacher_status === "pending").length;

  const STATUS_CONFIG = {
    pending: { label: "Bekliyor", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    approved: { label: "Onaylı", cls: "bg-teal-100 text-teal-700 border-teal-200" },
    rejected: { label: "Reddedildi", cls: "bg-red-100 text-red-700 border-red-200" },
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <Link href="/admin/kullanicilar" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm font-medium mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kullanıcılara Dön
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Öğretmen Onay Paneli
              {pendingCount > 0 && (
                <span className="px-2.5 py-1 bg-amber-500 text-white text-sm font-bold rounded-full">
                  {pendingCount} bekliyor
                </span>
              )}
            </h1>
            <p className="text-slate-600 mt-1">Yeni öğretmen başvurularını incele ve onayla veya reddet</p>
          </div>
          <button
            onClick={loadApplicants}
            disabled={loading}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, e-posta veya ders ara..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filter === s
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "pending" ? "Bekleyenler" : s === "approved" ? "Onaylılar" : s === "rejected" ? "Reddedilenler" : "Tümü"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-700 mb-1">
            {filter === "pending" ? "Bekleyen başvuru yok" : "Kayıt bulunamadı"}
          </h3>
          <p className="text-sm text-slate-500">Tüm öğretmen başvuruları işlendi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map((a) => {
            const statusCfg = STATUS_CONFIG[a.teacher_status];
            return (
              <div key={a.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${
                a.teacher_status === "pending" ? "border-amber-200 bg-amber-50/30" : "border-slate-200"
              }`}>
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-teal-700 font-bold text-lg shrink-0 overflow-hidden border border-teal-200/60">
                  {a.profile_photo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={a.profile_photo_url} alt={a.name} className="w-full h-full object-cover" />
                    : a.name.charAt(0).toUpperCase()
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-slate-900">{a.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{a.email}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {a.subject && (
                      <span className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-teal-500" /> {a.subject}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> {timeAgo(a.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedUser(a)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                    title="Profili İncele"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {a.teacher_status !== "approved" && (
                    <button
                      onClick={() => handleApprove(a.id)}
                      disabled={processing === a.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {processing === a.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Onayla
                    </button>
                  )}
                  {a.teacher_status !== "rejected" && (
                    <button
                      onClick={() => handleReject(a.id)}
                      disabled={processing === a.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-60 text-red-700 text-sm font-bold rounded-xl transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reddet
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detay Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Öğretmen Profili</h3>
              <button onClick={() => setSelectedUser(null)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-teal-700 font-bold text-2xl overflow-hidden">
                  {selectedUser.profile_photo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={selectedUser.profile_photo_url} alt={selectedUser.name} className="w-full h-full object-cover" />
                    : selectedUser.name.charAt(0)
                  }
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{selectedUser.name}</h4>
                  <p className="text-slate-500 text-sm">{selectedUser.email}</p>
                  {selectedUser.phone && <p className="text-slate-500 text-sm">{selectedUser.phone}</p>}
                </div>
              </div>
              {selectedUser.subject && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <p className="text-xs text-teal-600 font-semibold mb-1">Branş</p>
                  <p className="text-slate-900 font-medium">{selectedUser.subject}</p>
                </div>
              )}
              {selectedUser.bio && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Hakkında</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{selectedUser.bio}</p>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                {selectedUser.teacher_status !== "approved" && (
                  <button
                    onClick={() => { handleApprove(selectedUser.id); setSelectedUser(null); }}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Onayla
                  </button>
                )}
                {selectedUser.teacher_status !== "rejected" && (
                  <button
                    onClick={() => { handleReject(selectedUser.id); setSelectedUser(null); }}
                    className="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Reddet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

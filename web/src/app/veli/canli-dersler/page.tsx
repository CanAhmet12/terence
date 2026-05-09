"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { parentApi, type User, type TeacherLesson } from "@/lib/api";
import { Video, Calendar, Clock, RefreshCw, Loader2, Wifi, Play } from "lucide-react";

function fmt(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function VeliCanliDerslerPage() {
  const { token } = useAuth();
  const [children, setChildren] = useState<User[]>([]);
  const [childId, setChildId] = useState<number | "">("");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    if (!token) return;
    try {
      const list = await parentApi.getChildren();
      setChildren(Array.isArray(list) ? list : []);
    } catch {
      setChildren([]);
    }
  }, [token]);

  useEffect(() => {
    if (!token) setLoading(false);
  }, [token]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (children.length > 0 && childId === "") {
      setChildId(children[0].id);
    }
  }, [children, childId]);

  const loadLessons = useCallback(async () => {
    if (!token || !childId) {
      setLessons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await parentApi.getChildLiveLessons(Number(childId), tab);
      setLessons(Array.isArray(data) ? data : []);
    } catch {
      setLessons([]);
    }
    setLoading(false);
  }, [token, childId, tab]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  return (
    <div className="min-h-full min-w-0 overflow-x-hidden bg-slate-50 px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">Canlı dersler</h1>
        <p className="mb-8 text-slate-600">Bağlı çocuğunuzun yaklaşan ve geçmiş canlı derslerini görüntüleyin (salt okunur).</p>

        {!token ? (
          <p className="text-slate-600">Giriş yapmanız gerekir.</p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-xs font-bold text-slate-700">Çocuk</label>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
                >
                  <option value="">Seçin</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setTab("upcoming")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    tab === "upcoming" ? "bg-indigo-100 text-indigo-800" : "text-slate-600"
                  }`}
                >
                  Yaklaşan
                </button>
                <button
                  type="button"
                  onClick={() => setTab("past")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    tab === "past" ? "bg-indigo-100 text-indigo-800" : "text-slate-600"
                  }`}
                >
                  Geçmiş
                </button>
              </div>
              <button
                type="button"
                onClick={loadLessons}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {!childId ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                Görüntülenecek onaylı bir öğrenci bağlantısı seçin.
              </div>
            ) : loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : lessons.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                <Video className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                Kayıt bulunamadı.
              </div>
            ) : (
              <ul className="space-y-3">
                {lessons.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                        {tab === "past" ? <Play className="h-5 w-5 text-indigo-600" /> : <Wifi className="h-5 w-5 text-indigo-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{l.title || l.class_room?.name}</p>
                        <p className="text-xs text-slate-500">{l.teacher?.name}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {fmt(l.starts_at ?? l.scheduled_at)}
                          {l.duration_minutes != null && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {l.duration_minutes} dk
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                      {l.status === "live" ? "Canlı" : l.status === "ended" ? "Bitti" : "Planlı"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-8 text-xs text-slate-500">
              Katılım yalnızca öğrenci hesabından yapılabilir. Veli görünümü bilgilendirme amaçlıdır.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

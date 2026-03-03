"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, TeacherClass, TeacherStudent } from "@/lib/api";
import { Search, Circle, Users, TrendingUp, Clock, RefreshCw, ChevronRight } from "lucide-react";

const DEMO_CLASSES: TeacherClass[] = [
  {
    id: 1, name: "10-A Matematik", student_count: 24, avg_net: 48.5, risk_level: "green",
    students: [
      { id: 1, name: "Ahmet Yılmaz", email: "ahmet@test.com", net_score: 52, risk_level: "green", last_active_at: "2026-03-03", tasks_completed_today: 4, study_time_today_seconds: 5400 },
      { id: 2, name: "Zeynep Kaya", email: "zeynep@test.com", net_score: 45, risk_level: "yellow", last_active_at: "2026-03-02", tasks_completed_today: 2, study_time_today_seconds: 2100 },
      { id: 3, name: "Burak Demir", email: "burak@test.com", net_score: 38, risk_level: "red", last_active_at: "2026-02-28", tasks_completed_today: 0, study_time_today_seconds: 0 },
      { id: 4, name: "Selin Çelik", email: "selin@test.com", net_score: 61, risk_level: "green", last_active_at: "2026-03-03", tasks_completed_today: 5, study_time_today_seconds: 7200 },
    ],
  },
  {
    id: 2, name: "10-B Matematik", student_count: 22, avg_net: 42.1, risk_level: "yellow",
    students: [
      { id: 5, name: "Mehmet Arslan", email: "mehmet@test.com", net_score: 44, risk_level: "yellow", last_active_at: "2026-03-01", tasks_completed_today: 1, study_time_today_seconds: 900 },
      { id: 6, name: "Ayşe Yıldız", email: "ayse@test.com", net_score: 55, risk_level: "green", last_active_at: "2026-03-03", tasks_completed_today: 3, study_time_today_seconds: 4500 },
    ],
  },
  {
    id: 3, name: "11-A Fizik", student_count: 18, avg_net: 38.2, risk_level: "red",
    students: [
      { id: 7, name: "Cansu Öz", email: "cansu@test.com", net_score: 32, risk_level: "red", last_active_at: "2026-02-27", tasks_completed_today: 0, study_time_today_seconds: 0 },
      { id: 8, name: "Emre Kılıç", email: "emre@test.com", net_score: 40, risk_level: "yellow", last_active_at: "2026-03-01", tasks_completed_today: 2, study_time_today_seconds: 1800 },
    ],
  },
];

const RISK_CONFIG = {
  green: { label: "İyi", dot: "bg-green-500", badge: "bg-green-100 text-green-700" },
  yellow: { label: "Riskli", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  red: { label: "Çok Riskli", dot: "bg-red-500", badge: "bg-red-100 text-red-700" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function fmtTime(s: number) {
  if (s <= 0) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  return `${days} gün önce`;
}

export default function SiniflarPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"" | "green" | "yellow" | "red">("");

  const loadClasses = useCallback(async () => {
    if (isDemo || !token) {
      setClasses(DEMO_CLASSES);
      setSelectedClassId(DEMO_CLASSES[0]?.id ?? null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getTeacherClasses(token);
      setClasses(res);
      setSelectedClassId(res[0]?.id ?? null);
    } catch {
      setClasses(DEMO_CLASSES);
      setSelectedClassId(DEMO_CLASSES[0]?.id ?? null);
    }
    setLoading(false);
  }, [token, isDemo]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const students: TeacherStudent[] = selectedClass?.students ?? [];

  const filteredStudents = students.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchRisk = !riskFilter || s.risk_level === riskFilter;
    return matchSearch && matchRisk;
  });

  const riskCounts = {
    green: students.filter((s) => s.risk_level === "green").length,
    yellow: students.filter((s) => s.risk_level === "yellow").length,
    red: students.filter((s) => s.risk_level === "red").length,
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sınıflarım</h1>
          <p className="text-slate-600 mt-1">Öğrenci risk durumları · Günlük aktivite · Net takibi</p>
        </div>
        <button
          onClick={loadClasses}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          title="Yenile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          <div className="lg:col-span-2"><Skeleton className="h-96" /></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sınıf listesi */}
          <div className="space-y-2">
            {classes.map((c) => {
              const rConf = RISK_CONFIG[c.risk_level ?? "green"];
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedClassId === c.id
                      ? "bg-teal-50 border-teal-200 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-teal-600" />
                      </div>
                      <span className="font-semibold text-slate-900">{c.name}</span>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${rConf.dot}`} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 ml-10">
                    <span>{c.student_count} öğrenci</span>
                    {c.avg_net && <span>Ort. {c.avg_net} net</span>}
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${rConf.badge}`}>{rConf.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Öğrenci detay */}
          <div className="lg:col-span-2">
            {selectedClass ? (
              <>
                {/* Risk özeti */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {(["green", "yellow", "red"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRiskFilter(riskFilter === r ? "" : r)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        riskFilter === r
                          ? `border-transparent ${RISK_CONFIG[r].badge}`
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-2xl font-bold text-slate-900">{riskCounts[r]}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${riskFilter === r ? "" : "text-slate-500"}`}>
                        {RISK_CONFIG[r].label}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Arama */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Öğrenci ara..."
                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Öğrenci tablosu */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-5 py-3 font-semibold text-slate-600">Öğrenci</th>
                          <th className="text-right px-5 py-3 font-semibold text-slate-600">Net</th>
                          <th className="text-right px-5 py-3 font-semibold text-slate-600 hidden sm:table-cell">Çalışma</th>
                          <th className="text-right px-5 py-3 font-semibold text-slate-600 hidden md:table-cell">Son Aktif</th>
                          <th className="text-left px-5 py-3 font-semibold text-slate-600">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                              Öğrenci bulunamadı
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((s) => {
                            const rc = RISK_CONFIG[s.risk_level ?? "green"];
                            return (
                              <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">
                                      {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900">{s.name}</p>
                                      <p className="text-xs text-slate-400">{s.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <span className="font-bold text-slate-900">{s.net_score ?? "—"}</span>
                                </td>
                                <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                                  <span className="flex items-center justify-end gap-1 text-slate-600">
                                    <Clock className="w-3.5 h-3.5" />
                                    {fmtTime(s.study_time_today_seconds ?? 0)}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right text-slate-500 hidden md:table-cell">
                                  {s.last_active_at ? timeAgo(s.last_active_at) : "—"}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${rc.badge}`}>
                                    <Circle className="w-2.5 h-2.5 fill-current" />
                                    {rc.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Risk açıklama */}
                {riskCounts.red > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        {riskCounts.red} öğrenci ciddi risk altında
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        3+ gündür çalışmayan veya net artırmayan öğrencilerin velilerine otomatik bildirim gönderilecek.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Soldaki listeden sınıf seçin</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

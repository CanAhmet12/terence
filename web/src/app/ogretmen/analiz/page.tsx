"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { BarChart3, AlertCircle, Clock, TrendingDown, RefreshCw, MessageCircle, Filter, Users, Loader2, CheckCircle } from "lucide-react";

type StudentRow = {
  id: number;
  name: string;
  net: number;
  hedef: number;
  risk: "green" | "yellow" | "red";
  days_inactive?: number;
  weekly_change?: number;
};

type KazanimError = {
  kazanim_code?: string;
  subject?: string;
  error_count?: number;
  error_rate?: number;
  [key: string]: unknown;
};

type HardTopic = {
  topic?: string;
  subject?: string;
  wrong_rate?: number;
  [key: string]: unknown;
};

type TimeAnalysis = {
  subject?: string;
  avg_seconds?: number;
  [key: string]: unknown;
};

type RiskFilter = "all" | "inactive" | "net_drop" | "high_risk";

function Skeleton({ className }: { className?: string }) {
  return <div className={"bg-slate-100 rounded-xl animate-pulse " + (className ?? "")} />;
}

export default function AnalizPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  const [kazanimErrors, setKazanimErrors] = useState<KazanimError[]>([]);
  const [hardTopics, setHardTopics] = useState<HardTopic[]>([]);
  const [timeData, setTimeData] = useState<TimeAnalysis[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const loadData = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); setAnalyticsLoading(false); return; }
    if (!silent) setLoading(true); else setRefreshing(true);

    const [riskRes, kazanimRes, hardRes, timeRes] = await Promise.allSettled([
      api.getRiskStudents(token),
      api.getTeacherAnalytics(token, "kazanim-errors"),
      api.getTeacherAnalytics(token, "hard-topics"),
      api.getTeacherAnalytics(token, "time-analysis"),
    ]);

    if (riskRes.status === "fulfilled") {
      setStudents(riskRes.value.map((s) => ({
        id: s.id, name: s.name,
        net: s.current_net ?? 0, hedef: s.target_net ?? 50,
        risk: (s.risk_level ?? "green") as "green" | "yellow" | "red",
        days_inactive: s.days_inactive ?? 0,
        weekly_change: s.weekly_change ?? 0,
      })));
    } else {
      setStudents([]);
    }

    if (kazanimRes.status === "fulfilled") setKazanimErrors((kazanimRes.value.data ?? []) as KazanimError[]);
    if (hardRes.status === "fulfilled") setHardTopics((hardRes.value.data ?? []) as HardTopic[]);
    if (timeRes.status === "fulfilled") setTimeData((timeRes.value.data ?? []) as TimeAnalysis[]);

    setLoading(false);
    setAnalyticsLoading(false);
    setRefreshing(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleSendToParents = async () => {
    if (!token || selectedIds.size === 0) return;
    setSendingMsg(true);
    try {
      for (const id of selectedIds) {
        const student = students.find((s) => s.id === id);
        if (!student) continue;
        await api.sendMessage(token, {
          recipient_type: "student",
          recipient_id: id,
          recipient_name: student.name,
          content: `Sayın veli, ${student.name} adlı öğrenciniz son günlerde düşük performans göstermektedir. Lütfen destek olun.`,
          send_push: true,
        });
      }
      setMsgSent(true);
      clearSelection();
      setTimeout(() => setMsgSent(false), 4000);
    } catch {}
    setSendingMsg(false);
  };

  const riskDot = (r: "green" | "yellow" | "red") =>
    "w-3 h-3 rounded-full " + (r === "green" ? "bg-emerald-500" : r === "yellow" ? "bg-amber-500" : "bg-red-500");

  const filteredStudents = students.filter((s) => {
    if (riskFilter === "all") return true;
    if (riskFilter === "inactive") return (s.days_inactive ?? 0) >= 3;
    if (riskFilter === "net_drop") return (s.weekly_change ?? 0) < 0;
    if (riskFilter === "high_risk") return s.risk === "red";
    return true;
  });

  const RISK_FILTERS: { key: RiskFilter; label: string; color: string }[] = [
    { key: "all", label: "Tümü", color: "bg-slate-100 text-slate-700" },
    { key: "high_risk", label: "Yüksek Risk", color: "bg-red-50 text-red-700" },
    { key: "inactive", label: "3+ Gün Pasif", color: "bg-amber-50 text-amber-700" },
    { key: "net_drop", label: "Neti Düşenler", color: "bg-orange-50 text-orange-700" },
  ];

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analiz Merkezi</h1>
          <p className="text-slate-600 mt-1">Öğrenci bazlı net, kazanım bazlı hata, en zor konular, çözüm süreleri</p>
        </div>
        <button onClick={() => loadData(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors">
          <RefreshCw className={"w-4 h-4 " + (refreshing ? "animate-spin" : "")} /> Yenile
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Öğrenci Bazlı Net + Risk Filtreleri */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" /> Öğrenci Bazlı Net
            </h2>
            <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full font-medium">
              {filteredStudents.length} öğrenci
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400 mt-1.5 shrink-0" />
            {RISK_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setRiskFilter(f.key); clearSelection(); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  riskFilter === f.key
                    ? f.color + " border-current shadow-sm"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredStudents.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={selectedIds.size === filteredStudents.length ? clearSelection : selectAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                {selectedIds.size === filteredStudents.length ? "Seçimi Kaldır" : "Tümünü Seç"}
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleSendToParents}
                  disabled={sendingMsg}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors ml-auto disabled:opacity-70"
                >
                  {sendingMsg
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <MessageCircle className="w-3.5 h-3.5" />
                  }
                  {selectedIds.size} Öğrencinin Velisine Bildir
                </button>
              )}
              {msgSent && (
                <span className="flex items-center gap-1 text-xs text-teal-600 font-semibold ml-auto">
                  <CheckCircle className="w-4 h-4" /> Mesajlar gönderildi
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : filteredStudents.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">
              {riskFilter === "all" ? "Henüz öğrenci verisi yok." : "Bu filtreye uyan öğrenci yok."}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  onClick={() => toggleSelect(s.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedIds.has(s.id)
                      ? "bg-teal-50 border border-teal-200"
                      : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    selectedIds.has(s.id) ? "bg-teal-600 border-teal-600" : "border-slate-300"
                  }`}>
                    {selectedIds.has(s.id) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <div className={riskDot(s.risk)} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-900 text-sm">{s.name}</span>
                    {(s.days_inactive ?? 0) >= 3 && (
                      <span className="ml-2 text-xs text-amber-600 font-medium">{s.days_inactive}g pasif</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-900">{s.net}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {s.hedef}</span>
                    {(s.weekly_change ?? 0) !== 0 && (
                      <p className={`text-xs font-semibold ${(s.weekly_change ?? 0) > 0 ? "text-teal-600" : "text-red-500"}`}>
                        {(s.weekly_change ?? 0) > 0 ? "+" : ""}{s.weekly_change}
                      </p>
                    )}
                  </div>
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full " + (s.risk === "green" ? "bg-teal-500" : s.risk === "yellow" ? "bg-amber-500" : "bg-red-500")}
                      style={{ width: Math.min((s.net / Math.max(s.hedef, 1)) * 100, 100) + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kazanım bazlı hata */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" /> Kazanım Bazlı Hata
          </h2>
          <p className="text-sm text-slate-600 mb-5">En çok hata yapılan kazanımlar</p>
          {analyticsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : kazanimErrors.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Kazanım analizi verisi için öğrencilerinizin deneme çözmesi gerekmektedir.</p>
          ) : (
            <div className="space-y-2">
              {kazanimErrors.slice(0, 8).map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    {e.kazanim_code && <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded mr-2">{e.kazanim_code}</span>}
                    <span className="text-sm text-slate-700">{e.subject ?? "—"}</span>
                  </div>
                  <span className="text-sm font-bold text-red-600">{e.error_count ?? "—"} hata</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* En zor konular */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" /> En Zor Konular
          </h2>
          <p className="text-sm text-slate-600 mb-5">%65+ yanlış oranı = Türkiye geneli zor kazanım</p>
          {analyticsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : hardTopics.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Yeterli soru çözüm verisi biriktiğinde konular burada görünecektir.</p>
          ) : (
            <div className="space-y-2">
              {hardTopics.slice(0, 8).map((t, i) => {
                const rate = typeof t.wrong_rate === "number" ? t.wrong_rate : 0;
                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800">{t.topic ?? t.subject ?? "—"}</span>
                      <span className="text-sm font-bold text-red-600">%{Math.round(rate * 100)} yanlış</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(rate * 100, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Çözüm süresi analizi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-teal-600" /> Çözüm Süresi Analizi
          </h2>
          <p className="text-sm text-slate-600 mb-5">Ortalama çözüm süresi (dk/soru)</p>
          {analyticsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : timeData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Çözüm süresi verisi birikmesi için daha fazla soru çözümü gereklidir.</p>
          ) : (
            <div className="space-y-2">
              {timeData.slice(0, 8).map((t, i) => {
                const secs = t.avg_seconds ?? 0;
                const mins = (secs / 60).toFixed(1);
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-sm font-medium text-slate-800">{t.subject ?? "—"}</span>
                    <span className="font-bold text-teal-600 text-sm">{mins} dk/soru</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sınıf net dağılımı */}
      {!loading && students.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Sınıf Net Dağılımı</h2>
          <div className="flex items-end gap-2 h-32">
            {students.map((s) => (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-2">
                <div className={"w-full rounded-t-xl min-h-[8px] " + (s.risk === "green" ? "bg-teal-500" : s.risk === "yellow" ? "bg-amber-500" : "bg-red-500")}
                  style={{ height: (s.net / 100 * 100) + "%" }} title={s.name + ": " + s.net} />
                <span className="text-[10px] text-slate-500 truncate w-full text-center">{s.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

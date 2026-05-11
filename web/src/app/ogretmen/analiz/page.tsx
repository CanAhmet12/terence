"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, type TeacherAnalyticsResponse } from "@/lib/api";
import { BarChart3, AlertCircle, Clock, TrendingDown, RefreshCw, MessageCircle, Users, Loader2, CheckCircle } from "lucide-react";

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
};

type HardTopic = {
  topic?: string;
  subject?: string;
  wrong_rate?: number;
};

type TimeAnalysis = {
  subject?: string;
  avg_seconds?: number;
};

function parseKazanimErrors(res: TeacherAnalyticsResponse): KazanimError[] {
  const raw = res.data;
  if (!Array.isArray(raw)) return [];
  const out: KazanimError[] = [];
  for (const x of raw) {
    if (typeof x !== "object" || x === null || Array.isArray(x)) continue;
    const o = x as Record<string, unknown>;
    const ec = o.error_count;
    const er = o.error_rate;
    out.push({
      kazanim_code: typeof o.kazanim_code === "string" ? o.kazanim_code : undefined,
      subject: typeof o.subject === "string" ? o.subject : undefined,
      error_count: typeof ec === "number" ? ec : typeof ec === "string" ? Number(ec) : undefined,
      error_rate: typeof er === "number" ? er : typeof er === "string" ? Number(er) : undefined,
    });
  }
  return out;
}

function parseHardTopics(res: TeacherAnalyticsResponse): HardTopic[] {
  const raw = res.data;
  if (!Array.isArray(raw)) return [];
  const out: HardTopic[] = [];
  for (const x of raw) {
    if (typeof x !== "object" || x === null || Array.isArray(x)) continue;
    const o = x as Record<string, unknown>;
    const wr = o.wrong_rate;
    out.push({
      topic: typeof o.topic === "string" ? o.topic : undefined,
      subject: typeof o.subject === "string" ? o.subject : undefined,
      wrong_rate: typeof wr === "number" ? wr : typeof wr === "string" ? Number(wr) : undefined,
    });
  }
  return out;
}

function parseTimeAnalysis(res: TeacherAnalyticsResponse): TimeAnalysis[] {
  const raw = res.data;
  if (!Array.isArray(raw)) return [];
  const out: TimeAnalysis[] = [];
  for (const x of raw) {
    if (typeof x !== "object" || x === null || Array.isArray(x)) continue;
    const o = x as Record<string, unknown>;
    const av = o.avg_seconds;
    out.push({
      subject: typeof o.subject === "string" ? o.subject : undefined,
      avg_seconds: typeof av === "number" ? av : typeof av === "string" ? Number(av) : undefined,
    });
  }
  return out;
}

function rejMsg(reason: unknown): string {
  if (reason instanceof Error) return reason.message || "İstek başarısız.";
  if (typeof reason === "string") return reason;
  return "İstek başarısız.";
}

type RiskFilter = "all" | "inactive" | "net_drop" | "high_risk";

function Skeleton({ className }: { className?: string }) {
  return <div className={"bg-slate-100 rounded-xl animate-pulse " + (className ?? "")} />;
}

export default function AnalizPage() {
  const searchParams = useSearchParams();
  const topicFromDersler = searchParams.get("topic");
  const courseSlugFromDersler = searchParams.get("course");

  const { token } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [customMsg, setCustomMsg] = useState("");

  const [kazanimErrors, setKazanimErrors] = useState<KazanimError[]>([]);
  const [hardTopics, setHardTopics] = useState<HardTopic[]>([]);
  const [timeData, setTimeData] = useState<TimeAnalysis[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [studentsLoadError, setStudentsLoadError] = useState<string | null>(null);
  const [analyticsFetchFailedLabels, setAnalyticsFetchFailedLabels] = useState<string[]>([]);
  const [messageSendError, setMessageSendError] = useState<string | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!token) {
      setStudents([]);
      setKazanimErrors([]);
      setHardTopics([]);
      setTimeData([]);
      setStudentsLoadError(null);
      setAnalyticsFetchFailedLabels([]);
      setLoading(false);
      setAnalyticsLoading(false);
      setRefreshing(false);
      return;
    }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setStudentsLoadError(null);
    setAnalyticsFetchFailedLabels([]);

    const [riskRes, kazanimRes, hardRes, timeRes] = await Promise.allSettled([
      api.getRiskStudents(token),
      api.getTeacherAnalytics(token, "kazanim-errors"),
      api.getTeacherAnalytics(token, "hard-topics"),
      api.getTeacherAnalytics(token, "time-analysis"),
    ]);

    if (riskRes.status === "fulfilled") {
      setStudents(
        riskRes.value.map((s) => ({
          id: s.id,
          name: s.name,
          net: s.current_net ?? 0,
          hedef: s.target_net ?? 50,
          risk: (s.risk_level ?? "green") as "green" | "yellow" | "red",
          days_inactive: s.days_inactive ?? 0,
          weekly_change: s.weekly_change ?? 0,
        })),
      );
    } else {
      setStudents([]);
      setStudentsLoadError(rejMsg(riskRes.reason));
    }

    const failed: string[] = [];
    if (kazanimRes.status === "fulfilled") {
      setKazanimErrors(parseKazanimErrors(kazanimRes.value));
    } else {
      setKazanimErrors([]);
      failed.push("Kazanım hataları");
    }
    if (hardRes.status === "fulfilled") {
      setHardTopics(parseHardTopics(hardRes.value));
    } else {
      setHardTopics([]);
      failed.push("Zor konular");
    }
    if (timeRes.status === "fulfilled") {
      setTimeData(parseTimeAnalysis(timeRes.value));
    } else {
      setTimeData([]);
      failed.push("Çözüm süresi");
    }
    setAnalyticsFetchFailedLabels(failed);

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
    setMessageSendError(null);
    try {
      for (const id of selectedIds) {
        const student = students.find((s) => s.id === id);
        if (!student) continue;
        const msg = customMsg.trim()
          ? customMsg.replace("{isim}", student.name)
          : `Sayın veli, ${student.name} adlı öğrenciniz son günlerde düşük performans göstermektedir. Lütfen destek olun.`;
        await api.sendMessage({
          receiver_id: id,
          content: msg,
        } as Parameters<typeof api.sendMessage>[0]);
      }
      setShowMsgModal(false);
      setMsgSent(true);
      clearSelection();
      setCustomMsg("");
      setTimeout(() => setMsgSent(false), 4000);
    } catch (e) {
      setMessageSendError((e as Error).message || "Mesaj gönderilemedi.");
    } finally {
      setSendingMsg(false);
    }
  };

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

  const kazanimPanelFailed = analyticsFetchFailedLabels.includes("Kazanım hataları");
  const hardTopicsPanelFailed = analyticsFetchFailedLabels.includes("Zor konular");
  const timePanelFailed = analyticsFetchFailedLabels.includes("Çözüm süresi");

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full min-w-0 space-y-6 overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8 lg:px-6">

        {/* ── Başlık ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Analiz Merkezi</h1>
            <p className="text-slate-500 mt-1 font-medium">Öğrenci net dağılımı · Kazanım hataları · Zor konular · Çözüm süreleri</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData(true)}
            disabled={refreshing || !token}
            aria-label="Analiz verilerini yenile"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Yenile
          </button>
        </div>

        {(topicFromDersler || courseSlugFromDersler) && (
          <div
            className="rounded-2xl border border-indigo-100 bg-indigo-50/90 px-4 py-3 text-sm text-indigo-950"
            role="status"
          >
            <p className="font-semibold text-indigo-900">Derslerim üzerinden geldiniz</p>
            <p className="mt-1 text-indigo-800/90">
              {courseSlugFromDersler && (
                <>
                  Kurs: <span className="font-mono text-xs">{courseSlugFromDersler}</span>
                  {topicFromDersler ? " · " : ""}
                </>
              )}
              {topicFromDersler && (
                <>
                  Konu kimliği: <span className="font-mono text-xs">{topicFromDersler}</span>
                </>
              )}
              . Aşağıdaki grafikler sınıfınızdaki tüm öğrencilerin birleşik analizidir; seçilen konuya özel filtre henüz uygulanmaz.
            </p>
          </div>
        )}

        {analyticsFetchFailedLabels.length > 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p>
              Bazı analiz uçları yanıt vermedi: <strong>{analyticsFetchFailedLabels.join(", ")}</strong>. Bağlantınızı kontrol edip yenileyin.
            </p>
          </div>
        )}

        {/* ── İçerik ── */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Öğrenci Bazlı Net */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-bold text-slate-900">Öğrenci Bazlı Net</h2>
              </div>
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                {filteredStudents.length} öğrenci
              </span>
            </div>

            {/* Filtreler */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {RISK_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setRiskFilter(f.key);
                    clearSelection();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    riskFilter === f.key ? f.color + " border-current shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {studentsLoadError && !loading && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{studentsLoadError}</span>
              </div>
            )}

            {/* Toplu aksiyon */}
            {filteredStudents.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={selectedIds.size === filteredStudents.length ? clearSelection : selectAll}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  {selectedIds.size === filteredStudents.length ? "Seçimi Kaldır" : "Tümünü Seç"}
                </button>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessageSendError(null);
                      setShowMsgModal(true);
                    }}
                    disabled={sendingMsg}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors ml-auto disabled:opacity-70"
                  >
                    {sendingMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                    {selectedIds.size} Veliye Bildir
                  </button>
                )}
                {msgSent && (
                  <span className="flex items-center gap-1 text-xs text-cyan-600 font-semibold ml-auto">
                    <CheckCircle className="w-3.5 h-3.5" /> Gönderildi!
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                {studentsLoadError
                  ? "Öğrenci listesi yüklenemedi (üstteki uyarıya bakın)."
                  : riskFilter === "all"
                    ? "Henüz öğrenci verisi yok."
                    : "Bu filtreye uyan öğrenci yok."}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {filteredStudents.map((s) => (
                  <div key={s.id} onClick={() => toggleSelect(s.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all border ${
                      selectedIds.has(s.id) ? "bg-indigo-50 border-indigo-300" : "bg-slate-50 hover:bg-slate-100 border-transparent"
                    }`}>
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedIds.has(s.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-300"
                    }`}>
                      {selectedIds.has(s.id) && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    {/* Risk dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      s.risk === "green" ? "bg-cyan-500" : s.risk === "yellow" ? "bg-amber-500" : "bg-red-500"
                    }`} />
                    {/* İsim */}
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-900 text-sm">{s.name}</span>
                      {(s.days_inactive ?? 0) >= 3 && (
                        <span className="ml-2 text-[11px] text-amber-600 font-medium">{s.days_inactive}g pasif</span>
                      )}
                    </div>
                    {/* Net */}
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 text-sm">{s.net}</span>
                      <span className="text-xs text-slate-400 ml-1">/ {s.hedef}</span>
                    </div>
                    {/* Progress */}
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                      <div className={`h-full rounded-full ${s.risk === "green" ? "bg-cyan-500" : s.risk === "yellow" ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min((s.net / Math.max(s.hedef, 1)) * 100, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kazanım Hataları */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Kazanım Bazlı Hata</h2>
                <p className="text-xs text-slate-500 mt-0.5">En çok hata yapılan kazanımlar</p>
              </div>
            </div>
            <div className="mt-4">
              {analyticsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : kazanimErrors.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {kazanimPanelFailed ? "Bu veri şu an yüklenemedi. Sayfayı yenileyin." : "Veri birikmesi için deneme çözümü gerekli."}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {kazanimErrors.slice(0, 10).map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      {e.kazanim_code && (
                        <span className="font-mono text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md shrink-0 border border-cyan-100">
                          {e.kazanim_code}
                        </span>
                      )}
                      <span className="text-sm text-slate-700 flex-1 truncate">{e.subject ?? "—"}</span>
                      <span className="text-sm font-black text-red-600 shrink-0">{e.error_count ?? "—"} hata</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Zor Konular */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">En Zor Konular</h2>
                <p className="text-xs text-slate-500 mt-0.5">Yüksek yanlış oranı olan konular</p>
              </div>
            </div>
            <div className="mt-4">
              {analyticsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14" />)}</div>
              ) : hardTopics.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {hardTopicsPanelFailed ? "Bu veri şu an yüklenemedi. Sayfayı yenileyin." : "Yeterli veri birikmedi."}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {hardTopics.slice(0, 8).map((t, i) => {
                    const rate = typeof t.wrong_rate === "number" ? t.wrong_rate : 0;
                    const pct = Math.round(rate * 100);
                    return (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-slate-800 truncate">{t.topic ?? t.subject ?? "—"}</span>
                          <span className="text-sm font-black text-red-600 shrink-0 ml-2">%{pct} yanlış</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Çözüm Süresi */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Çözüm Süresi Analizi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ortalama çözüm süresi (dk/soru)</p>
              </div>
            </div>
            <div className="mt-4">
              {analyticsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : timeData.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  {timePanelFailed ? "Bu veri şu an yüklenemedi. Sayfayı yenileyin." : "Çözüm süresi verisi birikmedi."}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {timeData.slice(0, 8).map((t, i) => {
                    const secs = t.avg_seconds ?? 0;
                    const mins = (secs / 60).toFixed(1);
                    return (
                      <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-sm font-semibold text-slate-800">{t.subject ?? "—"}</span>
                        <span className="font-black text-cyan-600 text-sm">{mins} dk/soru</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Net Dağılımı Bar Chart */}
        {!loading && students.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-bold text-slate-900 mb-5">Sınıf Net Dağılımı</h2>
            <div className="flex items-end gap-2 h-32">
              {(() => {
                const maxNet = Math.max(...students.map((s) => s.net), 1);
                return students.map((s) => (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {s.name.split(" ")[0]}: {s.net}
                    </div>
                    <div
                      className={`w-full rounded-t-lg min-h-[6px] transition-all ${
                        s.risk === "green" ? "bg-cyan-400" : s.risk === "yellow" ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ height: `${Math.min((s.net / maxNet) * 100, 100)}%` }}
                    />
                    <span className="text-[9px] text-slate-400 truncate w-full text-center">{s.name.split(" ")[0]}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Veliye Bildir Modal */}
        {showMsgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="font-black text-lg text-slate-900 mb-1">Velilere Mesaj Gönder</h3>
              <p className="text-sm text-slate-500 mb-4">
                <strong className="text-indigo-700">{selectedIds.size} öğrenci</strong> seçildi.{" "}
                <code className="bg-slate-100 px-1 rounded text-xs">{"{isim}"}</code> ile öğrenci adını ekleyin.
              </p>
              <textarea value={customMsg} onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Sayın veli, {isim} adlı öğrenciniz son günlerde düşük performans göstermektedir..."
                rows={4}
                className="w-full border-2 border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 outline-none mb-4 transition-all" />
              {messageSendError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <span>{messageSendError}</span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleSendToParents()}
                  disabled={sendingMsg}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {sendingMsg ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                    : <><MessageCircle className="w-4 h-4" /> Gönder</>}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMsgModal(false);
                    setMessageSendError(null);
                  }}
                  className="px-5 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

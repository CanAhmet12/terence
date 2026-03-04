"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Building2, TrendingUp, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, GoalAnalysis, GoalInput } from "@/lib/api";

const SINAV_TYPES = [
  { value: "LGS", label: "LGS (8. Sınıf)" },
  { value: "TYT", label: "TYT (Temel Yeterlilik)" },
  { value: "AYT", label: "AYT (Alan Yeterlilik)" },
  { value: "KPSS", label: "KPSS" },
];

type SaveState = "idle" | "saving" | "success" | "error";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function HedefPage() {
  const { user, token, updateUser } = useAuth();


  const [analysis, setAnalysis] = useState<GoalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");

  // Form state
  const [examType, setExamType] = useState<GoalInput["exam_type"]>("TYT");
  const [targetSchool, setTargetSchool] = useState("");
  const [targetDept, setTargetDept] = useState("");
  const [targetNet, setTargetNet] = useState("");
  const [currentNet, setCurrentNet] = useState("");

  const loadAnalysis = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getGoalAnalysis(token);
      setAnalysis(res);
      // Formu mevcut hedefle doldur
      if (user?.goal) {
        setExamType((user.goal.exam_type as GoalInput["exam_type"]) ?? "TYT");
        setTargetSchool(user.goal.target_school ?? "");
        setTargetDept(user.goal.target_department ?? "");
        setTargetNet(String(user.goal.target_net ?? ""));
        setCurrentNet(String(user.goal.current_net ?? ""));
      }
    } catch {}
    setLoading(false);
  }, [token, user]);

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaveState("saving");
    setSaveError("");
    try {
      const updatedGoal = await api.updateGoal(token, {
        exam_type: examType,
        target_school: targetSchool || undefined,
        target_department: targetDept || undefined,
        target_net: targetNet ? parseInt(targetNet) : undefined,
        current_net: currentNet ? parseInt(currentNet) : undefined,
      });
      // Mevcut kullanıcıyı goal ile güncelle
      if (user) {
        updateUser({ ...user, goal: updatedGoal });
      }

      // Analizi yenile
      const newAnalysis = await api.getGoalAnalysis(token);
      setAnalysis(newAnalysis);

      setSaveState("success");
      setTimeout(() => setSaveState("idle"), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Kayıt başarısız");
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 5000);
    }
  };

  const riskConfig = {
    green: { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", icon: CheckCircle, label: "Hedefte İlerliyorsun" },
    yellow: { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700", icon: AlertTriangle, label: "Sınır Durumda — Dikkat" },
    red: { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", icon: AlertTriangle, label: "Yüksek Risk — Acil Müdahale" },
  };
  const riskLevel = (analysis?.risk_level ?? "green") as "green" | "yellow" | "red";
  const risk = riskConfig[riskLevel];
  const RiskIcon = risk.icon;

  const gapNet = analysis ? analysis.target_net - analysis.current_net : 0;
  const progressPct = analysis && analysis.target_net > 0
    ? Math.min((analysis.current_net / analysis.target_net) * 100, 100)
    : 0;

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Hedef & Net Motoru</h1>
        <p className="text-slate-600 mt-1 text-lg">
          Hedef okulunu ve bölümünü seç. Sistem gerekli neti hesaplasın, planı oluştursun.
        </p>
      </div>

      {/* Risk bandı */}
      {!loading && analysis && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 ${risk.bg} ${risk.border}`}>
          <RiskIcon className={`w-5 h-5 shrink-0 ${risk.text}`} />
          <div>
            <span className={`font-bold text-sm ${risk.text}`}>{risk.label}</span>
            <p className="text-xs text-slate-600 mt-0.5">
              Tahmin edilen net: <strong>{analysis.predicted_net}</strong> · Hedef: <strong>{analysis.target_net}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Akıllı Hedef Bilgi Kartı */}
      {!loading && analysis && analysis.days_remaining > 0 && (
        <div className="mb-8 grid sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-teal-500/20">
            <p className="text-teal-100 text-xs font-semibold uppercase tracking-wide mb-1">Sınava Kalan</p>
            <p className="text-3xl font-black">{analysis.days_remaining}</p>
            <p className="text-teal-100 text-sm mt-0.5">gün</p>
          </div>
          <div className={`rounded-2xl p-5 shadow-sm ${
            riskLevel === "red" ? "bg-red-50 border border-red-100" :
            riskLevel === "yellow" ? "bg-amber-50 border border-amber-100" :
            "bg-emerald-50 border border-emerald-100"
          }`}>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Haftada Gereken</p>
            <p className={`text-3xl font-black ${
              riskLevel === "red" ? "text-red-600" :
              riskLevel === "yellow" ? "text-amber-600" : "text-emerald-600"
            }`}>+{analysis.weekly_net_needed}</p>
            <p className="text-slate-500 text-sm mt-0.5">net artışı</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Artması Gereken</p>
            <p className="text-3xl font-black text-slate-900">+{gapNet}</p>
            <p className="text-slate-500 text-sm mt-0.5">toplam net</p>
          </div>
        </div>
      )}

      {/* Paket Yükseltme Önerisi */}
      {!loading && analysis && riskLevel === "red" && (!user?.subscription_plan || user.subscription_plan === "free") && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-lg">Yüksek Risk — Destek Almanın Tam Zamanı!</p>
              <p className="text-red-100 text-sm mt-1">
                Mevcut net hızınla hedefe ulaşman zor görünüyor. Pro paketteki kişisel koçluk ve özel plan sistemi
                net artışını hızlandırır. Pro paket öğrencilerinde %43 daha yüksek başarı oranı gözlemlenmektedir.
              </p>
            </div>
            <a
              href="/paketler"
              className="shrink-0 px-4 py-2.5 bg-white text-red-700 font-bold text-sm rounded-xl hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              Paketi İncele →
            </a>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Mevcut hedef özeti */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-lg transition-shadow">
          <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-teal-600" />
            </div>
            Mevcut Durumum
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {[
                { label: "Hedef Sınav", value: examType || "—" },
                { label: "Hedef Okul", value: targetSchool || "—" },
                { label: "Hedef Bölüm", value: targetDept || "—" },
                { label: "Sınava Kalan Gün", value: `${analysis.days_remaining} gün`, highlight: true },
                { label: "Haftalık Gerekli Net", value: `+${analysis.weekly_net_needed}`, highlight: true },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-4 px-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">{row.label}</span>
                  <span className={`font-bold ${row.highlight ? "text-teal-600" : "text-slate-900"}`}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm">Henüz hedef belirlenmedi. Aşağıdan bir hedef belirle.</p>
            </div>
          )}
        </div>

        {/* Net karşılaştırma + Form */}
        <div className="space-y-6">
          {/* Net karşılaştırma */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-lg transition-shadow">
            <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              Net Karşılaştırma
            </h2>

            {loading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className={`h-20 ${i === 3 ? "col-span-2" : ""}`} />)}
              </div>
            ) : analysis ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100">
                    <p className="text-xs text-slate-600 font-medium">Hedef Net</p>
                    <p className="text-2xl font-bold text-teal-600 mt-0.5">{analysis.target_net}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs text-slate-600 font-medium">Mevcut Net</p>
                    <p className="text-2xl font-bold text-slate-700 mt-0.5">{analysis.current_net}</p>
                  </div>
                  <div className="col-span-2 p-5 rounded-2xl bg-amber-50 border border-amber-100">
                    <p className="text-xs text-slate-600 font-medium">Artması Gereken Net</p>
                    <p className="text-2xl font-bold text-amber-700 mt-0.5">+{gapNet}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      Her {Math.ceil(analysis.days_remaining / Math.max(gapNet, 1))} günde +1 net hedefi gerekiyor.
                    </p>
                  </div>
                </div>
                {/* İlerleme çubuğu */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>İlerleme</span>
                    <span>{Math.round(progressPct)}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        riskLevel === "red" ? "bg-red-400" : riskLevel === "yellow" ? "bg-amber-400" : "bg-teal-500"
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Hedef belirleme formu */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-lg transition-shadow">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-teal-600" />
              Hedefi Güncelle
            </h3>

            {saveState === "success" && (
              <div className="flex items-center gap-3 mb-4 p-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-700 text-sm font-medium">
                <CheckCircle className="w-5 h-5 shrink-0" />
                Hedef başarıyla güncellendi. Plan yeniden hesaplandı.
              </div>
            )}
            {saveState === "error" && saveError && (
              <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-medium">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {saveError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Sınav</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as GoalInput["exam_type"])}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                >
                  {SINAV_TYPES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Okul</label>
                <input
                  type="text"
                  value={targetSchool}
                  onChange={(e) => setTargetSchool(e.target.value)}
                  placeholder="Örn: Hacettepe Üniversitesi"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Bölüm</label>
                <input
                  type="text"
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  placeholder="Örn: Tıp"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Hedef Net</label>
                  <input
                    type="number"
                    value={targetNet}
                    onChange={(e) => setTargetNet(e.target.value)}
                    placeholder="75"
                    min={0}
                    max={160}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mevcut Net</label>
                  <input
                    type="number"
                    value={currentNet}
                    onChange={(e) => setCurrentNet(e.target.value)}
                    placeholder="42"
                    min={0}
                    max={160}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saveState === "saving"}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
              >
                {saveState === "saving" ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Hedefi Kaydet & Planı Güncelle
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}





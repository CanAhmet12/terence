"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Video, FileQuestion, CalendarPlus, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, WeakAchievement } from "@/lib/api";

const DEMO_ZAYIF: WeakAchievement[] = [
  {
    id: 1,
    kod: "M.8.1.1",
    konu: "Üslü İfadeleri Çözer",
    subject: "Matematik",
    wrong_count: 4,
    total_count: 10,
    accuracy_rate: 60,
    suggestion: "Üslü sayılar videosu izle, 10 soru çöz",
  },
  {
    id: 2,
    kod: "F.9.2.1",
    konu: "Hareket Denklemleri",
    subject: "Fizik",
    wrong_count: 3,
    total_count: 8,
    accuracy_rate: 62,
    suggestion: "Hareket tekrar videosu + 5 soru",
  },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function ZayifKazanımPage() {
  const router = useRouter();
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [items, setItems] = useState<WeakAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingPlan, setAddingPlan] = useState<number | null>(null);
  const [planAdded, setPlanAdded] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    if (!token || isDemo) {
      setItems(DEMO_ZAYIF);
      setLoading(false);
      return;
    }
    try {
      const res = await api.getWeakAchievements(token);
      setItems(res);
    } catch {
      setError("Zayıf kazanımlar yüklenemedi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddToPlan = async (item: WeakAchievement) => {
    if (!token || planAdded.has(item.id)) return;
    setAddingPlan(item.id);
    try {
      await api.addCustomTask(token, `${item.konu} tekrar — ${item.suggestion ?? "Zayıf kazanım çalış"}`);
      setPlanAdded((prev) => new Set([...prev, item.id]));
    } catch {
      setError("Plana eklenemedi.");
    } finally {
      setAddingPlan(null);
    }
  };

  const handleVideo = (item: WeakAchievement) => {
    if (item.video_url) {
      router.push(item.video_url);
    } else {
      router.push(`/ogrenci/icerik?q=${encodeURIComponent(item.konu)}&type=video`);
    }
  };

  const handleQuestion = (item: WeakAchievement) => {
    router.push(`/ogrenci/soru-bankasi?achievement_code=${encodeURIComponent(item.kod)}`);
  };

  const accuracyColor = (rate: number) => {
    if (rate < 50) return "text-red-600";
    if (rate < 70) return "text-amber-600";
    return "text-emerald-600";
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/ogrenci" className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Ana panele dön
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Zayıf Kazanımlar</h1>
          <p className="text-slate-600 mt-1">
            Yanlış yaptığın kazanımlar — tekrar et, günlük plana ekle.
          </p>
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              Demo Modu — Veriler gerçek değil
            </span>
          )}
        </div>
        <button
          onClick={loadData}
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
          <button onClick={() => setError(null)} className="ml-3 underline text-sm">Kapat</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Harika! Zayıf kazanım yok</h2>
          <p className="text-slate-600">Çözülen sorularda belirgin bir zayıf kazanım tespit edilmedi.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg font-mono">
                      {item.kod}
                    </span>
                    {item.subject && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-lg">
                        {item.subject}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg">{item.konu}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-red-600">{item.wrong_count}</span>/{item.total_count} yanlış
                    </p>
                    <span className={`text-sm font-bold ${accuracyColor(item.accuracy_rate)}`}>
                      %{item.accuracy_rate} doğruluk
                    </span>
                  </div>
                  {item.suggestion && (
                    <p className="text-sm text-teal-700 mt-2 font-medium">
                      Öneri: {item.suggestion}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => handleVideo(item)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium text-sm transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Video
                  </button>
                  <button
                    onClick={() => handleQuestion(item)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium text-sm transition-colors"
                  >
                    <FileQuestion className="w-4 h-4" />
                    Soru Çöz
                  </button>
                  <button
                    onClick={() => handleAddToPlan(item)}
                    disabled={addingPlan === item.id || planAdded.has(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm transition-colors disabled:opacity-60 ${
                      planAdded.has(item.id)
                        ? "bg-emerald-50 text-emerald-700 cursor-default"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    {planAdded.has(item.id) ? (
                      <><CheckCircle className="w-4 h-4" /> Plana Eklendi</>
                    ) : addingPlan === item.id ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Ekleniyor...</>
                    ) : (
                      <><CalendarPlus className="w-4 h-4" /> Planıma Ekle</>
                    )}
                  </button>
                </div>
              </div>

              {/* Doğruluk çubuğu */}
              <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.accuracy_rate < 50 ? "bg-red-400" : item.accuracy_rate < 70 ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${item.accuracy_rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

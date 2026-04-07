"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { api, ChildSummary } from "@/lib/api";
import { Clock, TrendingUp, AlertTriangle, BarChart3, Mail, FileText, CheckCircle, Users, ChevronDown, Plus, Link as LinkIcon } from "lucide-react";

const WEEKS = ["H1", "H2", "H3", "H4", "H5", "H6", "H7"];

function secondsToHuman(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function VeliDashboardPage() {
  const { token } = useAuth();

  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childDropdown, setChildDropdown] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [showLink, setShowLink] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await api.getChildren();
      setChildren(Array.isArray(res) ? res as ChildSummary[] : []);
    } catch (e) {
      setError((e as Error).message || "Veriler yüklenemedi");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLinkChild = async () => {
    if (!token || !linkCode.trim()) return;
    setLinkLoading(true);
    setLinkError("");
    try {
      await api.linkChild(linkCode.trim());
      setLinkSuccess(true);
      setLinkCode("");
      setShowLink(false);
      setTimeout(() => setLinkSuccess(false), 4000);
      loadData();
    } catch (e) {
      setLinkError((e as Error).message || "Çocuk eklenemedi. Kod geçersiz olabilir.");
    }
    setLinkLoading(false);
  };

  const summary = children[selectedIdx] ?? null;
  const childName = summary?.child.name || "Çocuğunuz";
  const studyTime = secondsToHuman(summary?.study_time_today_seconds ?? 0);
  const netToday = summary?.net_today ?? 0;
  const riskLevel = summary?.risk_level ?? "green";
  const tasksDone = summary?.tasks_done_today ?? 0;
  const tasksTotal = summary?.tasks_total_today ?? 0;

  const riskColors = {
    green: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", label: "Hedefte İlerliyor" },
    yellow: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "Dikkat Gerekiyor" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", label: "Yüksek Risk" },
  };
  const risk = riskColors[riskLevel];

  const rawNets = summary?.weekly_nets
  const nets = Array.isArray(rawNets) ? rawNets : []
  const maxNet = nets.length > 0 ? Math.max(...nets, 1) : 1;
  const weeklyChange = nets.length >= 2 ? nets[nets.length - 1] - nets[0] : 0;

  type RecentExam = { title?: string; name?: string; net_score?: number; net?: number; finished_at?: string; date?: string; [k: string]: unknown };
  const recentExams: RecentExam[] = (summary?.recent_exams as unknown as RecentExam[]) ?? [];

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Veli Paneli</h1>
          <p className="text-slate-600 mt-1">
            Çocuklarınızın çalışma durumu ve gelişimi
          </p>
        </div>

        {/* Çocuk seçici */}
        {!loading && children.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setChildDropdown(!childDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-teal-300 transition-colors text-sm font-semibold text-slate-800"
              >
                {summary?.child.profile_photo_url ? (
                  <Image src={summary.child.profile_photo_url} alt={childName} width={24} height={24} className="w-6 h-6 rounded-lg object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                    {childName.charAt(0)}
                  </div>
                )}
                <span className="max-w-[120px] truncate">{childName}</span>
                <Users className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${childDropdown ? "rotate-180" : ""}`} />
              </button>

              {childDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setChildDropdown(false)} aria-hidden="true" />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 overflow-hidden">
                    <div className="p-2">
                      {children.map((c, i) => (
                        <button
                          key={c.child.id}
                          onClick={() => { setSelectedIdx(i); setChildDropdown(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            i === selectedIdx ? "bg-teal-50 text-teal-700" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {c.child.profile_photo_url ? (
                            <Image src={c.child.profile_photo_url} alt={c.child.name} width={28} height={28} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
                              {c.child.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 text-left">
                            <p className="truncate font-semibold">{c.child.name}</p>
                            {c.child.grade && <p className="text-xs text-slate-500">{c.child.grade}. Sınıf</p>}
                          </div>
                          {c.risk_level === "red" && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                          {c.risk_level === "yellow" && <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 p-2">
                      <button
                        onClick={() => { setChildDropdown(false); setShowLink(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Çocuk Ekle
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tüm çocukların risk özeti (birden fazlaysa) */}
      {!loading && children.length > 1 && (
        <div className="mb-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {children.map((c, i) => (
            <button
              key={c.child.id}
              onClick={() => setSelectedIdx(i)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                i === selectedIdx
                  ? "border-teal-400 bg-teal-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-teal-200"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                {c.child.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 text-sm truncate">{c.child.name}</p>
                <p className="text-xs text-slate-500">{c.child.grade ? `${c.child.grade}. Sınıf` : "—"}</p>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                c.risk_level === "green" ? "bg-emerald-500" :
                c.risk_level === "yellow" ? "bg-amber-500" : "bg-red-500"
              }`} />
            </button>
          ))}
        </div>
      )}

      {/* Çocuk ekleme formu */}
      {showLink && (
        <div className="mb-8 p-5 bg-white rounded-2xl border border-teal-200 shadow-sm">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
            <LinkIcon className="w-4 h-4 text-teal-600" />
            Çocuğunuzu Bağlayın
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Çocuğunuzun profilinden aldığı davet kodunu girin.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={linkCode}
              onChange={(e) => setLinkCode(e.target.value)}
              placeholder="DAVET KODUNU GİRİN"
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none uppercase tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && handleLinkChild()}
            />
            <button
              onClick={handleLinkChild}
              disabled={linkLoading || !linkCode.trim()}
              className="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors text-sm"
            >
              {linkLoading ? "Ekleniyor..." : "Ekle"}
            </button>
            <button
              onClick={() => { setShowLink(false); setLinkCode(""); setLinkError(""); }}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              İptal
            </button>
          </div>
          {linkError && <p className="text-sm text-red-600 mt-2">{linkError}</p>}
        </div>
      )}

      {linkSuccess && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-2xl text-sm text-teal-700 font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Çocuğunuz başarıyla eklendi!
        </div>
      )}

      {/* Henüz çocuk yok */}
      {!loading && children.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">Henüz Bağlı Çocuk Yok</h3>
          <p className="text-slate-600 text-sm mb-5">
            Çocuğunuzun profilinden aldığı davet kodu ile hesabını bağlayın.
          </p>
          <button
            onClick={() => setShowLink(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Çocuk Ekle
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Risk durumu bandı */}
      {!loading && summary && (
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 ${risk.bg} ${risk.border}`}>
          {riskLevel === "green" ? (
            <CheckCircle className={`w-5 h-5 shrink-0 ${risk.text}`} />
          ) : (
            <AlertTriangle className={`w-5 h-5 shrink-0 ${risk.text}`} />
          )}
          <div>
            <span className={`font-bold text-sm ${risk.text}`}>{childName} — {risk.label}</span>
            {riskLevel !== "green" && (
              <p className="text-xs text-slate-600 mt-0.5">
                Bu hızla devam ederse hedef bölüm risk altında. Pro pakete geçiş önerilir.
              </p>
            )}
          </div>
          {riskLevel !== "green" && (
            <Link href="/#paketler" className="ml-auto shrink-0 text-xs font-semibold text-amber-700 hover:underline whitespace-nowrap">
              Paketleri İncele →
            </Link>
          )}
        </div>
      )}

      {summary && (
        <>
          <div className="grid lg:grid-cols-2 gap-8 mb-10">
            {/* Bugünkü özet */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="font-bold text-slate-900 mb-6 text-lg">{childName} — Bugün</h2>
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-teal-50 border border-teal-100">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Çalışma</p>
                      <p className="text-xl font-bold text-slate-900">{studyTime || "0dk"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-teal-50 border border-teal-100">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Günlük Net</p>
                      <p className="text-xl font-bold text-slate-900">{netToday}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-700">Günlük Görevler</p>
                        <span className="text-sm font-bold text-teal-600">{tasksDone}/{tasksTotal}</span>
                      </div>
                      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all"
                          style={{ width: tasksTotal > 0 ? `${(tasksDone / tasksTotal) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <Link
                href="/veli/rapor"
                className="mt-6 block text-center py-3 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors"
              >
                Detaylı Rapor →
              </Link>
            </div>

            {/* Zayıf dersler */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="font-bold text-slate-900 mb-4 text-lg">Zayıf Dersler</h2>
              <p className="text-sm text-slate-600 mb-5">
                Hata oranı yüksek dersler ve tekrar edilmesi önerilen konular
              </p>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : summary?.weak_subjects?.length ? (
                <ul className="space-y-3">
                  {summary.weak_subjects.map(({ subject, accuracy }) => (
                    <li key={subject} className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-900">{subject}</span>
                        <span className={`text-sm font-semibold ${accuracy < 70 ? "text-red-600" : "text-amber-600"}`}>
                          %{accuracy} doğru
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${accuracy < 70 ? "bg-red-400" : "bg-amber-400"}`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">Henüz yeterli veri yok.</p>
              )}
            </div>
          </div>

          {/* Net gelişim grafiği */}
          {nets.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-2 text-lg">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                Net Gelişim Grafiği
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Son {nets.length} haftalık net değişimi · Haftalık değişim: {weeklyChange >= 0 ? "+" : ""}{weeklyChange}
              </p>
              {loading ? (
                <div className="flex items-end gap-2 h-40">
                  {WEEKS.map((_, i) => <Skeleton key={i} className="flex-1 h-full" />)}
                </div>
              ) : (
                <div className="flex items-end gap-2 h-40">
                  {nets.map((net, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-teal-600 to-teal-400 min-h-[20px] transition-all hover:from-teal-700 relative group"
                        style={{ height: `${(net / maxNet) * 100}%` }}
                      >
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 whitespace-nowrap">
                          {net}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{WEEKS[i] ?? `H${i + 1}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Deneme sonuçları */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow mb-10">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-lg">
              <FileText className="w-5 h-5 text-teal-600" />
              Son Deneme Sonuçları
            </h2>
            {loading ? (
              <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : recentExams.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">Henüz deneme sonucu yok.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Deneme</th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700">Tarih</th>
                      <th className="text-right py-4 px-4 font-semibold text-slate-700">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExams.map((d, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-900">{String(d.title ?? d.name ?? "—")}</td>
                        <td className="py-4 px-4 text-slate-600">
                          {(d.finished_at ?? d.date) ? new Date(String(d.finished_at ?? d.date)).toLocaleDateString("tr-TR") : "—"}
                        </td>
                        <td className="text-right py-4 px-4 font-bold text-teal-600">
                          {(d.net_score ?? d.net) !== undefined ? Number(d.net_score ?? d.net).toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link
              href="/veli/rapor"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Tüm Denemeler →
            </Link>
          </div>
        </>
      )}

      {/* Bildirim Tercihleri */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-lg">
          <Mail className="w-5 h-5 text-teal-600" />
          Bildirim Tercihleri
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          SMS ve e-posta ile çalışma hatırlatmaları, deneme uyarıları, hedef risk bildirimleri
        </p>
        <Link
          href="/veli/bildirim"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold transition-colors"
        >
          Bildirim Ayarları →
        </Link>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, BadgeData, LeaderboardEntry } from "@/lib/api";
import { Trophy, Award, TrendingUp, Star, RefreshCw, Crown, AlertCircle, Globe, Filter } from "lucide-react";

// SVG Circular Progress Ring
function ProgressRing({ pct, size = 44, strokeWidth = 4, color = "#0d9488" }: { pct: number; size?: number; strokeWidth?: number; color?: string }) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(pct), 50);
    return () => clearTimeout(timer);
  }, [pct]);

  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(animatedPct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
      />
    </svg>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

type MainTab = "badges" | "leaderboard" | "national";

const EXAM_TYPES = ["", "TYT", "AYT", "LGS", "KPSS"];
const GRADES = ["", "9", "10", "11", "12"];

export default function RozetPage() {
  const { token, user } = useAuth();

  const [mainTab, setMainTab] = useState<MainTab>("badges");
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nationalBoard, setNationalBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [nationalLoading, setNationalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [examFilter, setExamFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [badges, board] = await Promise.all([
        api.getBadges(),
        api.getLeaderboard(period),
      ]);
      setBadgeData(badges as BadgeData);
      setLeaderboard(Array.isArray(board) ? board : []);
    } catch (e) {
      setError((e as Error).message || "Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  const loadLeaderboard = useCallback(async () => {
    if (!token) return;
    setLeaderboardLoading(true);
    try {
      const board = await api.getLeaderboard(period);
      setLeaderboard(Array.isArray(board) ? board : []);
    } catch (e) {
      setError((e as Error).message || "Sıralama yüklenemedi");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [token, period]);

  const loadNational = useCallback(async () => {
    if (!token) return;
    setNationalLoading(true);
    try {
      const res = await api.getLeaderboard("monthly");
      setNationalBoard(Array.isArray(res) ? res : []);
    } catch {
      setNationalBoard([]);
    } finally {
      setNationalLoading(false);
    }
  }, [token, examFilter, gradeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!loading && token) loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  useEffect(() => {
    if (mainTab === "national" && token) loadNational();
  }, [mainTab, loadNational, token]);

  useEffect(() => {
    if (mainTab === "national") loadNational();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examFilter, gradeFilter]);

  const xpPct = badgeData ? Math.round(((badgeData.xp ?? 0) / (badgeData.xp_next_level ?? 100)) * 100) : 0;
  const earnedCount = badgeData?.badges.filter((b) => b.earned).length ?? 0;

  const MAIN_TABS: { key: MainTab; label: string; icon: React.ElementType }[] = [
    { key: "badges", label: "Rozetler & XP", icon: Trophy },
    { key: "leaderboard", label: "Sınıf Sıralaması", icon: TrendingUp },
    { key: "national", label: "Türkiye Sıralaması", icon: Globe },
  ];

  const renderLeaderboardEntry = (entry: LeaderboardEntry) => (
    <div
      key={entry.rank}
      className={`flex items-center gap-4 p-4 transition-colors ${
        entry.is_current_user ? "bg-teal-50 border-l-4 border-l-teal-500" : "hover:bg-slate-50/50"
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
        entry.rank === 1 ? "bg-amber-100 text-amber-600" :
        entry.rank === 2 ? "bg-slate-200 text-slate-600" :
        entry.rank === 3 ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-500"
      }`}>
        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
      </div>
      {entry.profile_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.profile_photo_url} alt={entry.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
          {entry.name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${entry.is_current_user ? "text-teal-700" : "text-slate-900"}`}>
          {entry.name}
          {entry.is_current_user && <span className="ml-2 text-xs text-teal-500">(Sen)</span>}
        </p>
        <p className="text-xs text-slate-400">
          {Math.floor((entry.study_minutes ?? 0) / 60)}s {(entry.study_minutes ?? 0) % 60}dk çalışma
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-teal-600">+{entry.net_increase} net</p>
        {entry.xp_points !== undefined && (
          <p className="text-xs text-amber-600 font-semibold">{entry.xp_points?.toLocaleString("tr")} XP</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Motivasyon & Başarılar</h1>
          <p className="text-slate-600 mt-1">Rozetler, sıralama ve seviye sistemi</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors mt-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto text-red-600 font-semibold hover:underline text-xs">Yenile</button>
        </div>
      )}

      {/* Seviye + XP */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-500 rounded-3xl p-7 text-white shadow-xl shadow-teal-500/20">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-48 bg-teal-400/50" />
            <Skeleton className="h-4 bg-teal-400/50" />
          </div>
        ) : badgeData ? (
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl shrink-0">
              <Star className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-xl">Seviye {badgeData.level}</p>
                <p className="text-teal-100 text-sm font-medium">{badgeData.xp} / {badgeData.xp_next_level} XP</p>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
              </div>
              <p className="text-teal-100 text-xs mt-2">
                Bir sonraki seviyeye {(badgeData.xp_next_level ?? 0) - (badgeData.xp ?? 0)} XP · {earnedCount} rozet kazanıldı
              </p>
            </div>
          </div>
        ) : (
          <p className="text-teal-100 text-sm">XP verisi yüklenemedi.</p>
        )}
      </div>

      {/* Ana Sekmeler */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {MAIN_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mainTab === key
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Rozetler Tab */}
      {mainTab === "badges" && (
        <>
          {!loading && badgeData?.weekly_champion && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-600" />
                Haftanın Çalışkanı
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-200 flex items-center justify-center text-3xl shrink-0">🏆</div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">{badgeData.weekly_champion.name}</p>
                  <p className="text-sm text-slate-600">
                    {Math.floor((badgeData.weekly_champion.study_minutes ?? 0) / 60)}s {(badgeData.weekly_champion.study_minutes ?? 0) % 60}dk çalışma
                    · +{badgeData.weekly_champion.net_increase} net artış
                  </p>
                </div>
                <Crown className="w-8 h-8 text-amber-500 ml-auto" />
              </div>
            </div>
          )}
          <div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-5">
              <Trophy className="w-5 h-5 text-amber-600" />
              Rozetler
              {badgeData && (
                <span className="text-xs font-medium text-slate-500 ml-1">({earnedCount}/{badgeData.badges.length} kazanıldı)</span>
              )}
            </h2>
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : (badgeData?.badges ?? []).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
                Henüz rozet verisi yok.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(badgeData?.badges ?? []).map((badge) => {
                  const progressPct = badge.earned ? 100 : (badge.progress !== undefined && badge.required !== undefined) ? Math.round((badge.progress / badge.required) * 100) : 0;
                  return (
                    <div
                      key={badge.id}
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        badge.earned
                          ? "bg-amber-50 border-amber-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border relative ${badge.earned ? "bg-white border-amber-100" : "bg-slate-100 border-slate-200"}`}>
                          {badge.earned
                            ? (badge.emoji ?? "✅")
                            : (
                              <span className="relative">
                                <span className="text-2xl opacity-30">{badge.emoji ?? "🏅"}</span>
                                <span className="absolute -bottom-0.5 -right-0.5 text-xs">🔒</span>
                              </span>
                            )
                          }
                        </div>
                        {/* Progress ring — sadece kilitli rozetlerde göster */}
                        {!badge.earned && badge.required !== undefined && badge.required > 0 && (
                          <div className="relative">
                            <ProgressRing pct={progressPct} size={44} strokeWidth={4} color="#0d9488" />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-teal-700">
                              {progressPct}%
                            </span>
                          </div>
                        )}
                        {badge.earned && (
                          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-teal-600 text-sm">✓</span>
                          </div>
                        )}
                      </div>
                      <h3 className={`font-bold text-sm ${badge.earned ? "text-slate-900" : "text-slate-600"}`}>{badge.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                      {/* Kilitli rozet için "nasıl kazanılır" ipucu */}
                      {!badge.earned && !badge.progress && (
                        <p className="text-[11px] text-slate-400 font-medium mt-2 italic">Kazanmak için çalışmaya devam et</p>
                      )}
                      {/* İlerleme durumu metin */}
                      {!badge.earned && badge.progress !== undefined && badge.required !== undefined && (
                        <p className="text-[11px] text-teal-600 font-semibold mt-2">{badge.progress}/{badge.required} tamamlandı</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          badge.earned ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-400"
                        }`}>
                          +{badge.xp_reward} XP
                        </span>
                        {badge.earned && badge.earned_at && (
                          <span className="text-xs text-slate-400">
                            {new Date(badge.earned_at).toLocaleDateString("tr-TR")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Sınıf Sıralaması Tab */}
      {mainTab === "leaderboard" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              Sınıf / Grup Sıralaması
            </h2>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
              {(["weekly", "monthly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === p ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {p === "weekly" ? "Haftalık" : "Aylık"}
                </button>
              ))}
            </div>
          </div>
          {loading || leaderboardLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-7 h-7 text-teal-400" />
              </div>
              <p className="font-semibold text-slate-700">Henüz sıralama oluşmadı</p>
              <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">Soru çöz ve görevleri tamamla — bu haftanın sıralamasında ilk sen görün!</p>
              <Link href="/ogrenci/soru-bankasi" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:underline">
                Soru Bankasına Git →
              </Link>
            </div>
          ) : (
            <>
              {/* Top 3 podium */}
              {leaderboard.length >= 3 && (
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-end justify-center gap-4">
                    {/* 2. sıra */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                        {leaderboard[1]?.name.charAt(0)}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 max-w-[60px] text-center truncate">{leaderboard[1]?.name}</p>
                      <div className="w-16 bg-slate-200 rounded-t-lg flex flex-col items-center py-2" style={{ height: "60px" }}>
                        <span className="text-xl">🥈</span>
                        <span className="text-[10px] font-bold text-slate-600 mt-auto">{leaderboard[1]?.net_increase}n</span>
                      </div>
                    </div>
                    {/* 1. sıra */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-700 font-bold">
                        {leaderboard[0]?.name.charAt(0)}
                      </div>
                      <p className="text-xs font-bold text-slate-900 max-w-[70px] text-center truncate">{leaderboard[0]?.name}</p>
                      <div className="w-16 bg-amber-400 rounded-t-lg flex flex-col items-center py-2" style={{ height: "80px" }}>
                        <span className="text-xl">🥇</span>
                        <span className="text-[10px] font-bold text-white mt-auto">{leaderboard[0]?.net_increase}n</span>
                      </div>
                    </div>
                    {/* 3. sıra */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-sm">
                        {leaderboard[2]?.name.charAt(0)}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 max-w-[60px] text-center truncate">{leaderboard[2]?.name}</p>
                      <div className="w-16 bg-amber-100 rounded-t-lg flex flex-col items-center py-2" style={{ height: "45px" }}>
                        <span className="text-xl">🥉</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="divide-y divide-slate-100">{leaderboard.map(renderLeaderboardEntry)}</div>
            </>
          )}
        </div>
      )}

      {/* Türkiye Sıralaması Tab */}
      {mainTab === "national" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600" />
                Türkiye Geneli Sıralama
              </h2>
              <button
                onClick={loadNational}
                disabled={nationalLoading}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-slate-400 ${nationalLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="text-sm px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {EXAM_TYPES.map((t) => <option key={t} value={t}>{t || "Tüm Sınavlar"}</option>)}
                </select>
              </div>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="text-sm px-3 py-1.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              >
                {GRADES.map((g) => <option key={g} value={g}>{g ? g + ". Sınıf" : "Tüm Sınıflar"}</option>)}
              </select>
              {(examFilter || gradeFilter) && (
                <button
                  onClick={() => { setExamFilter(""); setGradeFilter(""); }}
                  className="text-xs text-slate-500 hover:text-red-500 font-medium transition-colors"
                >
                  Filtreyi Temizle ✕
                </button>
              )}
            </div>
            {user?.goal?.exam_type && (
              <p className="text-xs text-slate-400 mt-3">
                Hedef sınavın: <strong className="text-teal-600">{user.goal.exam_type}</strong>
                {user.goal.grade ? ` · ${user.goal.grade}. Sınıf` : ""}
              </p>
            )}
          </div>
          {nationalLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : nationalBoard.length === 0 ? (
            <div className="p-10 text-center">
              <Globe className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold text-slate-500">Türkiye geneli sıralama verisi bulunamadı.</p>
              <p className="text-sm text-slate-400 mt-1">Daha fazla öğrenci platformu kullandıkça sıralama oluşacak.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">{nationalBoard.map(renderLeaderboardEntry)}</div>
          )}
        </div>
      )}
    </div>
  );
}

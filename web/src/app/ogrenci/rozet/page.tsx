"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, BadgeData, LeaderboardEntry } from "@/lib/api";
import {
  Trophy, TrendingUp, Star, RefreshCw, Crown, AlertCircle,
  Globe, Filter, Medal, Zap, Lock, ChevronRight, Award
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-white/10 rounded-xl animate-pulse ${className ?? ""}`} />;
}

// SVG Dairesel progress
function ProgressRing({ pct, size = 44, strokeWidth = 4, color = "#6366f1" }: {
  pct: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const [animatedPct, setAnimatedPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPct(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(animatedPct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// Rozet kalite renkleri
const TIER_CONFIG = {
  gold:   { glow: "shadow-amber-500/40", ring: "ring-amber-400/60", bg: "from-amber-300 to-amber-600", text: "#f59e0b" },
  silver: { glow: "shadow-slate-400/40", ring: "ring-slate-300/60", bg: "from-slate-300 to-slate-500", text: "#94a3b8" },
  bronze: { glow: "shadow-orange-700/40", ring: "ring-orange-600/40", bg: "from-orange-700 to-orange-900", text: "#a16207" },
  default:{ glow: "shadow-indigo-500/30", ring: "ring-indigo-400/40", bg: "from-indigo-400 to-indigo-700", text: "#6366f1" },
};

function BadgeCard({ badge, earned }: {
  badge: BadgeData["badges"][number];
  earned: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const pct = badge.earned ? 100 : (badge.progress !== undefined && (badge as Record<string, unknown>).required !== undefined)
    ? Math.round((badge.progress! / ((badge as Record<string, unknown>).required as number)) * 100)
    : 0;

  const tier = (badge as Record<string, unknown>).tier as string ?? "default";
  const tierStyle = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.default;

  return (
    <div
      className="flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 cursor-pointer group"
      style={{
        background: earned ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
        border: hovered && earned ? `1px solid ${tierStyle.text}60` : "1px solid rgba(255,255,255,0.08)",
        transform: hovered && earned ? "translateY(-4px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rozet ikonu */}
      <div className="relative">
        {earned ? (
          <>
            {/* Glow efekti */}
            {hovered && (
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-60"
                style={{ background: `radial-gradient(circle, ${tierStyle.text}80, transparent)`, transform: "scale(1.5)" }}
              />
            )}
            <div
              className={`relative w-14 h-14 rounded-full flex items-center justify-center text-2xl
                shadow-xl ${tierStyle.glow} ring-2 ${tierStyle.ring} transition-all duration-300`}
              style={{ background: `linear-gradient(135deg, ${tierStyle.text}40, ${tierStyle.text}80)` }}
            >
              {(badge as Record<string, unknown>).emoji as string ?? "🏅"}
            </div>
          </>
        ) : (
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl grayscale opacity-40">
              {(badge as Record<string, unknown>).emoji as string ?? "🏅"}
            </div>
            {/* Progress ring */}
            {pct > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ProgressRing pct={pct} size={60} strokeWidth={3} color={tierStyle.text} />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div className="text-center">
        <p className={`text-xs font-bold leading-tight ${earned ? "text-white" : "text-white/30"}`}>
          {badge.name}
        </p>
        {earned ? (
          <div className="flex items-center justify-center gap-1 mt-1">
            <Star className="w-2.5 h-2.5 text-amber-400" fill="#f59e0b" />
            <span className="text-[10px] text-amber-400 font-semibold">+{badge.xp_reward} XP</span>
          </div>
        ) : (
          <p className="text-[10px] text-white/20 mt-0.5">
            {pct > 0 ? `%${pct}` : "Kilitli"}
          </p>
        )}
      </div>
    </div>
  );
}

// Liderboard satırı
function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const isTop3 = rank <= 3;
  const medals = ["🥇", "🥈", "🥉"];
  const isMe = entry.is_current_user;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
      isMe
        ? "bg-indigo-500/20 border border-indigo-500/40"
        : "hover:bg-white/5"
    }`}>
      {/* Sıra */}
      <div className="w-8 text-center shrink-0">
        {isTop3 ? (
          <span className="text-xl">{medals[rank - 1]}</span>
        ) : (
          <span className="text-sm font-bold text-white/40">{rank}</span>
        )}
      </div>

      {/* Avatar */}
      {entry.profile_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.profile_photo_url} alt={entry.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-sm font-bold text-indigo-300 shrink-0">
          {entry.name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* İsim */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isMe ? "text-indigo-300" : "text-white/90"}`}>
          {entry.name}
          {isMe && <span className="ml-2 text-[10px] text-indigo-400">(Sen)</span>}
        </p>
        <p className="text-[11px] text-white/40">
          {Math.floor((entry.study_minutes ?? 0) / 60)}s {(entry.study_minutes ?? 0) % 60}dk çalışma
        </p>
      </div>

      {/* Net + XP */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-teal-400">+{entry.net_increase ?? 0} net</p>
        {entry.xp_points !== undefined && (
          <p className="text-[11px] text-amber-400 font-medium">{entry.xp_points.toLocaleString("tr")} XP</p>
        )}
      </div>
    </div>
  );
}

const EXAM_TYPES = ["", "TYT", "AYT", "LGS", "KPSS"];
const GRADES = ["", "9", "10", "11", "12"];

type MainTab = "badges" | "leaderboard" | "national";

export default function RozetPage() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>("badges");
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [nationalBoard, setNationalBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lbLoading, setLbLoading] = useState(false);
  const [natLoading, setNatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [examFilter, setExamFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const badges = await api.getBadges();
      setBadgeData(badges as BadgeData);
    } catch (e) {
      setError((e as Error).message || "Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const board = await api.getLeaderboard(period);
      setLeaderboard(Array.isArray(board) ? board : []);
    } catch {}
    setLbLoading(false);
  }, [period]);

  const loadNational = useCallback(async () => {
    setNatLoading(true);
    try {
      // examFilter ve gradeFilter backend destekliyorsa query olarak gönderilir
      const board = await api.getLeaderboard("monthly");
      // Client-side filtreleme (backend henüz desteklemiyorsa)
      const filtered = Array.isArray(board)
        ? board.filter((entry) => {
            if (examFilter && (entry as Record<string, unknown>).exam_type !== examFilter) return false;
            if (gradeFilter && String((entry as Record<string, unknown>).grade ?? "") !== gradeFilter) return false;
            return true;
          })
        : [];
      setNationalBoard(filtered);
    } catch {
      setNationalBoard([]);
    }
    setNatLoading(false);
  }, [examFilter, gradeFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);
  useEffect(() => {
    if (mainTab === "national") loadNational();
  }, [mainTab, loadNational]);

  const xpPct = badgeData ? Math.round(((badgeData.xp ?? 0) / (badgeData.xp_next_level ?? 100)) * 100) : 0;
  const earnedCount = (badgeData?.badges ?? []).filter((b) => b.earned).length;

  const TABS = [
    { key: "badges" as MainTab,      label: "Rozetler & XP",      icon: Trophy },
    { key: "leaderboard" as MainTab, label: "Sınıf Sıralaması",   icon: TrendingUp },
    { key: "national" as MainTab,    label: "Türkiye",             icon: Globe },
  ];

  return (
    <div className="bg-slate-900 min-h-full text-white">
      <div className="w-full px-6 py-8 space-y-8">

        {/* ── Başlık ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Motivasyon & Başarılar</h1>
            <p className="text-slate-400 mt-1 font-medium">Rozetler, sıralama ve seviye sistemi</p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/60 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* ── Hata ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
            <button onClick={loadData} className="ml-auto text-red-300 font-semibold text-sm hover:text-red-200">Yenile</button>
          </div>
        )}

        {/* ── Seviye + XP Hero ── */}
        <div className="relative overflow-hidden rounded-3xl p-8"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6d28d9 50%, #7c3aed 100%)" }}>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-20 bottom-0 w-32 h-32 bg-violet-500/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-7">
            {/* Seviye dairesi */}
            <div className="relative shrink-0">
              {loading ? (
                <Skeleton className="w-20 h-20 rounded-full" />
              ) : (
                <>
                  <ProgressRing pct={xpPct} size={88} strokeWidth={6} color="#fbbf24" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-black leading-none">{badgeData?.level ?? 1}</p>
                      <p className="text-[10px] text-white/60 font-medium">LVL</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bilgi */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-40 bg-white/20" />
                  <Skeleton className="h-4 w-56 bg-white/20" />
                  <Skeleton className="h-3 w-full bg-white/20" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-black leading-none">
                    {badgeData?.xp?.toLocaleString("tr") ?? 0}{" "}
                    <span className="text-white/60 font-normal text-base">/ {badgeData?.xp_next_level?.toLocaleString("tr") ?? 1000} XP</span>
                  </p>
                  <p className="text-white/70 text-sm mt-1.5">
                    Bir sonraki seviyeye{" "}
                    <strong className="text-white">{((badgeData?.xp_next_level ?? 0) - (badgeData?.xp ?? 0)).toLocaleString("tr")} XP</strong> kaldı
                  </p>
                  <div className="mt-3 h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-700"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                  <p className="text-white/50 text-xs mt-1.5">{earnedCount} rozet kazanıldı</p>
                </>
              )}
            </div>

            {/* Streak */}
            <div className="text-center shrink-0 hidden sm:block">
              <div className="text-4xl font-black leading-none">
                {(user?.streak_days ?? 0) > 0 ? "🔥" : "⭐"}
              </div>
              <p className="text-white font-black text-xl mt-1 leading-none">{user?.streak_days ?? 0}</p>
              <p className="text-white/50 text-[11px] mt-0.5">gün seri</p>
            </div>
          </div>
        </div>

        {/* ── Ana Sekmeler ── */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMainTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mainTab === key
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ════ ROZETLER ════ */}
        {mainTab === "badges" && (
          <div className="space-y-6">
            {/* Haftanın çalışkanı */}
            {!loading && badgeData?.weekly_champion && (
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl shrink-0">🏆</div>
                <div>
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-0.5">Haftanın Çalışkanı</p>
                  <p className="text-lg font-black text-white">{badgeData.weekly_champion.name}</p>
                  <p className="text-sm text-white/50">
                    {Math.floor((badgeData.weekly_champion.study_minutes ?? 0) / 60)}s {(badgeData.weekly_champion.study_minutes ?? 0) % 60}dk · +{badgeData.weekly_champion.net_increase} net artış
                  </p>
                </div>
                <Crown className="w-8 h-8 text-amber-500 ml-auto shrink-0" />
              </div>
            )}

            {/* Rozet grid */}
            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : (badgeData?.badges ?? []).length === 0 ? (
              <div className="text-center py-16">
                <Award className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="font-semibold text-white/60">Henüz rozet yok</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {(badgeData?.badges ?? []).map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={badge.earned ?? false} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ SINIF SIRALAMASI ════ */}
        {mainTab === "leaderboard" && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold">Sınıf / Grup Sıralaması</h2>
              </div>
              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5">
                {(["weekly", "monthly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      period === p ? "bg-white/20 text-white" : "text-white/50 hover:text-white/70"
                    }`}
                  >
                    {p === "weekly" ? "Haftalık" : "Aylık"}
                  </button>
                ))}
              </div>
            </div>

            {loading || lbLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="font-semibold text-white/60">Henüz sıralama oluşmadı</p>
                <p className="text-sm text-white/30 mt-1">Soru çöz ve görevleri tamamla</p>
                <Link href="/ogrenci/soru-bankasi" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                  Soru Bankasına Git <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <>
                {/* Top 3 podyum */}
                {leaderboard.length >= 3 && (
                  <div className="p-5 border-b border-white/10">
                    <div className="flex items-end justify-center gap-4">
                      {/* 2. */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-600 flex items-center justify-center text-slate-300 font-bold text-sm">
                          {leaderboard[1]?.name.charAt(0)}
                        </div>
                        <p className="text-xs font-semibold text-white/60 max-w-[60px] text-center truncate">{leaderboard[1]?.name}</p>
                        <div className="w-16 bg-slate-600 rounded-t-lg flex flex-col items-center py-2" style={{ height: "55px" }}>
                          <span className="text-xl">🥈</span>
                        </div>
                      </div>
                      {/* 1. */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/30 border-2 border-amber-500/60 flex items-center justify-center text-amber-300 font-bold">
                          {leaderboard[0]?.name.charAt(0)}
                        </div>
                        <p className="text-xs font-bold text-white max-w-[70px] text-center truncate">{leaderboard[0]?.name}</p>
                        <div className="w-16 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-lg flex flex-col items-center py-2" style={{ height: "75px" }}>
                          <span className="text-xl">🥇</span>
                        </div>
                      </div>
                      {/* 3. */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-900/50 border border-amber-700/40 flex items-center justify-center text-amber-600 font-bold text-sm">
                          {leaderboard[2]?.name.charAt(0)}
                        </div>
                        <p className="text-xs font-semibold text-white/60 max-w-[60px] text-center truncate">{leaderboard[2]?.name}</p>
                        <div className="w-16 bg-amber-900/40 rounded-t-lg flex flex-col items-center py-2" style={{ height: "40px" }}>
                          <span className="text-xl">🥉</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tam liste */}
                <div className="divide-y divide-white/5 p-2">
                  {leaderboard.map((entry, i) => (
                    <LeaderboardRow key={entry.user_id ?? i} entry={entry} rank={i + 1} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ TÜRKİYE SIRALAMASI ════ */}
        {mainTab === "national" && (
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-teal-400" />
                  <h2 className="font-bold">Türkiye Geneli Sıralama</h2>
                </div>
                <button onClick={loadNational} disabled={natLoading} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/50 hover:text-white transition-all">
                  <RefreshCw className={`w-3.5 h-3.5 ${natLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-white/40 shrink-0" />
                  <select
                    value={examFilter}
                    onChange={(e) => setExamFilter(e.target.value)}
                    className="text-sm px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none text-white/80 focus:ring-1 focus:ring-indigo-400"
                  >
                    {EXAM_TYPES.map((t) => <option key={t} value={t} className="bg-slate-800">{t || "Tüm Sınavlar"}</option>)}
                  </select>
                </div>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="text-sm px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none text-white/80 focus:ring-1 focus:ring-indigo-400"
                >
                  {GRADES.map((g) => <option key={g} value={g} className="bg-slate-800">{g ? g + ". Sınıf" : "Tüm Sınıflar"}</option>)}
                </select>
                {(examFilter || gradeFilter) && (
                  <button
                    onClick={() => { setExamFilter(""); setGradeFilter(""); }}
                    className="text-xs text-white/40 hover:text-white/60 font-medium"
                  >
                    Temizle ✕
                  </button>
                )}
              </div>
            </div>

            {natLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : nationalBoard.length === 0 ? (
              <div className="p-12 text-center">
                <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="font-semibold text-white/60">Türkiye geneli sıralama verisi bulunamadı</p>
                <p className="text-sm text-white/30 mt-1">Daha fazla öğrenci katıldıkça sıralama oluşacak</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 p-2">
                {nationalBoard.map((entry, i) => (
                  <LeaderboardRow key={entry.user_id ?? i} entry={entry} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

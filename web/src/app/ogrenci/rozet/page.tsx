"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api, BadgeData, LeaderboardEntry } from "@/lib/api";
import {
  Trophy,
  TrendingUp,
  Star,
  RefreshCw,
  Crown,
  AlertCircle,
  Globe,
  Filter,
  Zap,
  Lock,
  ChevronRight,
  Award,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-slate-200/70 animate-pulse", className)} />;
}

/** Dairesel XP ilerlemesi — açık tema */
function ProgressRing({
  pct,
  size = 44,
  strokeWidth = 4,
  color = "#6366f1",
  trackColor = "#e2e8f0",
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
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
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

const TIER_STYLES = {
  gold: {
    card: "border-amber-200/90 bg-gradient-to-b from-amber-50/80 to-white",
    ring: "ring-amber-300/50 bg-gradient-to-br from-amber-100 to-amber-200",
    accent: "text-amber-700",
    dot: "bg-amber-400",
  },
  silver: {
    card: "border-slate-200 bg-gradient-to-b from-slate-50/90 to-white",
    ring: "ring-slate-300/50 bg-gradient-to-br from-slate-100 to-slate-200",
    accent: "text-slate-600",
    dot: "bg-slate-400",
  },
  bronze: {
    card: "border-orange-200/90 bg-gradient-to-b from-orange-50/70 to-white",
    ring: "ring-orange-300/50 bg-gradient-to-br from-orange-100 to-orange-200",
    accent: "text-orange-800",
    dot: "bg-orange-500",
  },
  default: {
    card: "border-slate-200 bg-white",
    ring: "ring-violet-300/40 bg-gradient-to-br from-violet-100 to-indigo-100",
    accent: "text-violet-700",
    dot: "bg-violet-500",
  },
} as const;

function BadgeCard({
  badge,
  earned,
}: {
  badge: BadgeData["badges"][number];
  earned: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const pct = badge.earned
    ? 100
    : badge.progress !== undefined && badge.required !== undefined && badge.required > 0
      ? Math.round((badge.progress / badge.required) * 100)
      : 0;

  const tier = badge.tier ?? "default";
  const tierStyle = TIER_STYLES[tier as keyof typeof TIER_STYLES] ?? TIER_STYLES.default;
  const emoji = badge.emoji ?? "🏅";

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-all duration-300",
        earned
          ? cn(tierStyle.card, "shadow-sm hover:shadow-md", hovered && "ring-1 ring-slate-200/80 -translate-y-0.5")
          : "border-slate-100 bg-slate-50/50 hover:bg-slate-50",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center">
        {earned ? (
          <>
            <div
              className={cn(
                "relative flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-inner ring-2 transition-transform duration-300",
                tierStyle.ring,
                hovered && "scale-[1.03]",
              )}
            >
              {emoji}
            </div>
            <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white", tierStyle.dot)} />
          </>
        ) : (
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl grayscale opacity-[0.45]">
              {emoji}
            </div>
            {pct > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ProgressRing pct={pct} size={60} strokeWidth={3} color="#94a3b8" trackColor="#f1f5f9" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
              <Lock className="h-3 w-3 text-slate-400" aria-hidden />
            </div>
          </div>
        )}
      </div>

      <div className="min-h-[3rem] w-full">
        <p
          className={cn(
            "text-xs font-semibold leading-snug tracking-tight line-clamp-2",
            earned ? "text-slate-900" : "text-slate-400",
          )}
        >
          {badge.name}
        </p>
        {earned ? (
          <div className="mt-1.5 flex items-center justify-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden />
            <span className="text-[11px] font-semibold text-amber-700">+{badge.xp_reward} XP</span>
          </div>
        ) : (
          <p className="mt-1 text-[10px] font-medium text-slate-400">{pct > 0 ? `%${pct}` : "Kilitli"}</p>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const isTop3 = rank <= 3;
  const medals = ["🥇", "🥈", "🥉"];
  const isMe = entry.is_current_user;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors sm:px-4",
        isMe ? "bg-violet-50 ring-1 ring-violet-200/80" : "hover:bg-slate-50",
      )}
    >
      <div className="w-9 shrink-0 text-center">
        {isTop3 ? (
          <span className="text-lg leading-none" aria-hidden>
            {medals[rank - 1]}
          </span>
        ) : (
          <span className="text-sm font-bold tabular-nums text-slate-400">{rank}</span>
        )}
      </div>

      {entry.profile_photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.profile_photo_url} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-sm font-bold text-violet-800 ring-1 ring-violet-200/60">
          {entry.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", isMe ? "text-violet-900" : "text-slate-900")}>
          {entry.name}
          {isMe && (
            <span className="ml-2 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
              Sen
            </span>
          )}
        </p>
        <p className="text-[11px] text-slate-500">
          {Math.floor((entry.study_minutes ?? 0) / 60)}s {(entry.study_minutes ?? 0) % 60}dk çalışma
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums text-cyan-600">+{entry.net_increase ?? 0} net</p>
        {entry.xp_points !== undefined && (
          <p className="text-[11px] font-medium tabular-nums text-amber-700">{entry.xp_points.toLocaleString("tr")} XP</p>
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
    } catch {
      setLeaderboard([]);
    }
    setLbLoading(false);
  }, [period]);

  const loadNational = useCallback(async () => {
    setNatLoading(true);
    try {
      const board = await api.getLeaderboard("monthly");
      const filtered = Array.isArray(board)
        ? board.filter((entry) => {
            if (examFilter && entry.exam_type !== examFilter) return false;
            if (gradeFilter && String(entry.grade ?? "") !== gradeFilter) return false;
            return true;
          })
        : [];
      setNationalBoard(filtered);
    } catch {
      setNationalBoard([]);
    }
    setNatLoading(false);
  }, [examFilter, gradeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);
  useEffect(() => {
    if (mainTab === "national") loadNational();
  }, [mainTab, loadNational]);

  const xpPct = badgeData ? Math.round(((badgeData.xp ?? 0) / (badgeData.xp_next_level ?? 100)) * 100) : 0;
  const earnedCount = (badgeData?.badges ?? []).filter((b) => b.earned).length;
  const totalBadges = (badgeData?.badges ?? []).length;

  const TABS = [
    { key: "badges" as MainTab, label: "Rozetler & XP", icon: Trophy },
    { key: "leaderboard" as MainTab, label: "Sınıf Sıralaması", icon: TrendingUp },
    { key: "national" as MainTab, label: "Türkiye", icon: Globe },
  ];

  return (
    <div className="min-h-full bg-white text-slate-900 antialiased">
      <div className="w-full px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
        {/* Üst başlık */}
        <header className="mb-8 flex flex-col gap-6 border-b border-slate-100 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600">Başarı merkezi</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Rozetler ve sıralama</h1>
            <p className="max-w-xl text-sm leading-relaxed text-slate-500">
              Çalışmalarını takip et, rozetleri topla ve seviyeni yükselt. İlerlemen burada özetlenir.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw className={cn("h-4 w-4 text-slate-500", loading && "animate-spin")} aria-hidden />
            Yenile
          </button>
        </header>

        {error && (
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={loadData} className="font-semibold text-red-700 underline-offset-2 hover:underline">
              Tekrar dene
            </button>
          </div>
        )}

        {/* Seviye kartı */}
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_24px_-8px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-violet-100/90 to-indigo-50 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-amber-100/40 blur-2xl" aria-hidden />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-10">
            <div className="relative mx-auto shrink-0 lg:mx-0">
              {loading ? (
                <Skeleton className="h-[5.5rem] w-[5.5rem] rounded-full" />
              ) : (
                <>
                  <ProgressRing pct={xpPct} size={92} strokeWidth={7} color="#7c3aed" trackColor="#e2e8f0" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-black tabular-nums leading-none text-slate-900">{badgeData?.level ?? 1}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Seviye</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-full max-w-md" />
                  <Skeleton className="h-2.5 w-full rounded-full" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-2xl font-black tabular-nums text-slate-900 sm:text-3xl">
                      {(badgeData?.xp ?? 0).toLocaleString("tr")}
                    </span>
                    <span className="text-base font-medium text-slate-400">/</span>
                    <span className="text-lg font-semibold tabular-nums text-slate-500">
                      {(badgeData?.xp_next_level ?? 1000).toLocaleString("tr")} XP
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Sonraki seviye için{" "}
                    <strong className="font-semibold text-slate-900">
                      {Math.max(0, (badgeData?.xp_next_level ?? 0) - (badgeData?.xp ?? 0)).toLocaleString("tr")} XP
                    </strong>{" "}
                    kaldı.
                  </p>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 transition-[width] duration-700 ease-out"
                      style={{ width: `${Math.min(xpPct, 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                      {earnedCount} / {totalBadges || "—"} rozet
                    </span>
                    <span className="hidden sm:inline text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                      <span className="font-semibold text-slate-700">{user?.streak_days ?? 0}</span> gün seri
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex shrink-0 justify-center rounded-2xl border border-slate-100 bg-slate-50/80 px-8 py-5 text-center lg:border-0 lg:bg-transparent lg:px-4 lg:py-0">
              <div>
                <div className="text-3xl leading-none">{((user?.streak_days ?? 0) > 0 ? "🔥" : "⭐")}</div>
                <p className="mt-2 text-2xl font-black tabular-nums text-slate-900">{user?.streak_days ?? 0}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">gün üst üste</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sekmeler */}
        <div className="mb-10 flex gap-1 rounded-2xl border border-slate-200 bg-slate-50/80 p-1 shadow-inner">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMainTab(key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition-all sm:text-sm",
                mainTab === key
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="hidden min-[400px]:inline">{label}</span>
              <span className="min-[400px]:hidden">{label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {mainTab === "badges" && (
          <div className="space-y-10">
            {!loading && badgeData?.weekly_champion && (
              <div className="flex flex-col gap-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-3xl shadow-inner ring-1 ring-amber-200/60">
                  🏆
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-800/90">Haftanın çalışkanı</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{badgeData.weekly_champion.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {Math.floor((badgeData.weekly_champion.study_minutes ?? 0) / 60)} saat{" "}
                    {(badgeData.weekly_champion.study_minutes ?? 0) % 60} dk · +
                    {badgeData.weekly_champion.net_increase} net artış
                  </p>
                </div>
                <Crown className="hidden h-9 w-9 shrink-0 text-amber-500 sm:block" strokeWidth={1.5} aria-hidden />
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-36 rounded-2xl" />
                ))}
              </div>
            ) : (badgeData?.badges ?? []).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
                <Award className="mx-auto mb-4 h-14 w-14 text-slate-300" strokeWidth={1.25} aria-hidden />
                <p className="text-lg font-semibold text-slate-700">Henüz rozet yok</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  Görevleri tamamladıkça rozetlerin burada görünecek.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {(badgeData?.badges ?? []).map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} earned={badge.earned ?? false} />
                ))}
              </div>
            )}
          </div>
        )}

        {mainTab === "leaderboard" && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Sınıf / grup sıralaması</h2>
                  <p className="text-xs text-slate-500">Haftalık ve aylık net artışına göre</p>
                </div>
              </div>
              <div className="flex w-full rounded-xl border border-slate-200 bg-slate-50 p-0.5 sm:w-auto">
                {(["weekly", "monthly"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "flex-1 rounded-lg px-4 py-2 text-xs font-bold transition-colors sm:flex-none",
                      period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
                    )}
                  >
                    {p === "weekly" ? "Haftalık" : "Aylık"}
                  </button>
                ))}
              </div>
            </div>

            {loading || lbLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-slate-200" strokeWidth={1.25} aria-hidden />
                <p className="font-semibold text-slate-700">Henüz sıralama oluşmadı</p>
                <p className="mt-1 text-sm text-slate-500">Soru çöz ve görevleri tamamla.</p>
                <Link
                  href="/ogrenci/soru-bankasi"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                >
                  Soru bankasına git <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ) : (
              <>
                {leaderboard.length >= 3 && (
                  <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-4 py-8">
                    <div className="mx-auto flex max-w-lg items-end justify-center gap-3 sm:gap-6">
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-sm font-bold text-slate-700 ring-1 ring-slate-300/80">
                          {leaderboard[1]?.name.charAt(0)}
                        </div>
                        <p className="max-w-[72px] truncate text-xs font-semibold text-slate-600">{leaderboard[1]?.name}</p>
                        <div
                          className="flex w-[4.5rem] flex-col items-center justify-end rounded-t-xl bg-gradient-to-t from-slate-300 to-slate-200 pb-2 pt-3 ring-1 ring-slate-300/60 sm:w-20"
                          style={{ height: "56px" }}
                        >
                          <span className="text-lg">🥈</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-lg font-bold text-amber-900 ring-2 ring-amber-300/80 shadow-md">
                          {leaderboard[0]?.name.charAt(0)}
                        </div>
                        <p className="max-w-[80px] truncate text-xs font-bold text-slate-900">{leaderboard[0]?.name}</p>
                        <div
                          className="flex w-[4.5rem] flex-col items-center justify-end rounded-t-xl bg-gradient-to-t from-amber-500 to-amber-400 pb-2 pt-4 text-white shadow-md ring-1 ring-amber-400/50 sm:w-20"
                          style={{ height: "76px" }}
                        >
                          <span className="text-xl">🥇</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-sm font-bold text-orange-900 ring-1 ring-orange-200">
                          {leaderboard[2]?.name.charAt(0)}
                        </div>
                        <p className="max-w-[72px] truncate text-xs font-semibold text-slate-600">{leaderboard[2]?.name}</p>
                        <div
                          className="flex w-[4.5rem] flex-col items-center justify-end rounded-t-xl bg-gradient-to-t from-orange-200 to-orange-100 pb-2 pt-3 ring-1 ring-orange-200 sm:w-20"
                          style={{ height: "44px" }}
                        >
                          <span className="text-lg">🥉</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="divide-y divide-slate-100 px-2 py-2">
                  {leaderboard.map((entry, i) => (
                    <LeaderboardRow key={entry.user_id ?? i} entry={entry} rank={i + 1} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {mainTab === "national" && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                    <Globe className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">Türkiye geneli</h2>
                    <p className="text-xs text-slate-500">Filtreleri kullanarak kapsamı daraltabilirsin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadNational}
                  disabled={natLoading}
                  className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", natLoading && "animate-spin")} aria-hidden />
                  Listeyi yenile
                </button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  <select
                    value={examFilter}
                    onChange={(e) => setExamFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t || "Tüm sınavlar"}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g ? `${g}. sınıf` : "Tüm sınıflar"}
                    </option>
                  ))}
                </select>
                {(examFilter || gradeFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setExamFilter("");
                      setGradeFilter("");
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Filtreleri temizle
                  </button>
                )}
              </div>
            </div>

            {natLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : nationalBoard.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Globe className="mx-auto mb-4 h-12 w-12 text-slate-200" strokeWidth={1.25} aria-hidden />
                <p className="font-semibold text-slate-700">Sıralama verisi bulunamadı</p>
                <p className="mt-1 text-sm text-slate-500">Katılım arttıkça liste oluşacaktır.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 px-2 py-2">
                {nationalBoard.map((entry, i) => (
                  <LeaderboardRow key={entry.user_id ?? i} entry={entry} rank={i + 1} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, BadgeData, LeaderboardEntry } from "@/lib/api";
import { Trophy, Award, TrendingUp, Star, Loader2, RefreshCw, Crown } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

const DEMO_BADGES: BadgeData = {
  level: 3,
  xp: 240,
  xp_next_level: 400,
  weekly_champion: { name: "Elif K.", study_minutes: 420, net_increase: 8 },
  badges: [
    { id: 1, name: "İlk Adım", description: "İlk görevi tamamla", emoji: "🎯", earned: true, earned_at: "2025-01-10", xp_reward: 10 },
    { id: 2, name: "5 Gün Üst Üste", description: "5 gün arka arkaya çalış", emoji: "🔥", earned: true, earned_at: "2025-01-15", xp_reward: 25 },
    { id: 3, name: "Net Artırıcı", description: "Haftada +5 net artış", emoji: "📈", earned: false, xp_reward: 50 },
    { id: 4, name: "Soru Makinesi", description: "100 soru çöz", emoji: "💪", earned: false, xp_reward: 30 },
    { id: 5, name: "Video Uzmanı", description: "10 video izle", emoji: "📺", earned: false, xp_reward: 20 },
    { id: 6, name: "Haftanın Çalışkanı", description: "Haftanın birincisi ol", emoji: "🏆", earned: false, xp_reward: 100 },
  ],
};

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Elif K.", study_minutes: 420, net_increase: 8, is_current_user: false },
  { rank: 2, name: "Ahmet Y.", study_minutes: 380, net_increase: 6, is_current_user: false },
  { rank: 3, name: "Sen (Örnek)", study_minutes: 320, net_increase: 5, is_current_user: true },
  { rank: 4, name: "Zeynep M.", study_minutes: 290, net_increase: 4, is_current_user: false },
  { rank: 5, name: "Can D.", study_minutes: 250, net_increase: 3, is_current_user: false },
];

export default function RozetPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const loadData = useCallback(async () => {
    setLoading(true);
    if (isDemo || !token) {
      setBadgeData(DEMO_BADGES);
      setLeaderboard(DEMO_LEADERBOARD);
      setLoading(false);
      return;
    }
    try {
      const [badges, board] = await Promise.all([
        api.getBadges(token),
        api.getLeaderboard(token, period),
      ]);
      setBadgeData(badges);
      setLeaderboard(board);
    } catch {
      setBadgeData(DEMO_BADGES);
      setLeaderboard(DEMO_LEADERBOARD);
    }
    setLoading(false);
  }, [token, isDemo, period]);

  useEffect(() => { loadData(); }, [loadData]);

  const xpPct = badgeData ? Math.round((badgeData.xp / badgeData.xp_next_level) * 100) : 0;
  const earnedCount = badgeData?.badges.filter((b) => b.earned).length ?? 0;

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Motivasyon & Başarılar</h1>
          <p className="text-slate-600 mt-1">Rozetler, haftalık sıralama ve seviye sistemi</p>
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              Demo Modu
            </span>
          )}
        </div>
        <button onClick={loadData} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors mt-1">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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
              ⭐
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
                Bir sonraki seviyeye {badgeData.xp_next_level - badgeData.xp} XP · {earnedCount} rozet kazanıldı
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Haftanın Çalışkanı */}
      {!loading && badgeData?.weekly_champion && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-600" />
            Haftanın Çalışkanı
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-200 flex items-center justify-center text-3xl shrink-0">
              🏆
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">{badgeData.weekly_champion.name}</p>
              <p className="text-sm text-slate-600">
                {Math.floor(badgeData.weekly_champion.study_minutes / 60)}s {badgeData.weekly_champion.study_minutes % 60}dk çalışma
                · +{badgeData.weekly_champion.net_increase} net artış
              </p>
            </div>
            <Crown className="w-8 h-8 text-amber-500 ml-auto" />
          </div>
        </div>
      )}

      {/* Sıralama Tablosu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Sıralama
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

        {loading ? (
          <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  entry.is_current_user ? "bg-teal-50 border-l-4 border-l-teal-500" : "hover:bg-slate-50/50"
                }`}
              >
                {/* Sıra */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                  entry.rank === 1 ? "bg-amber-100 text-amber-600" :
                  entry.rank === 2 ? "bg-slate-200 text-slate-600" :
                  entry.rank === 3 ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-500"
                }`}>
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                  {entry.name.charAt(0)}
                </div>

                {/* İsim */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${entry.is_current_user ? "text-teal-700" : "text-slate-900"}`}>
                    {entry.name}
                    {entry.is_current_user && <span className="ml-2 text-xs text-teal-500">(Sen)</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {Math.floor(entry.study_minutes / 60)}s {entry.study_minutes % 60}dk çalışma
                  </p>
                </div>

                {/* Net */}
                <span className="text-sm font-bold text-teal-600">+{entry.net_increase} net</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rozetler */}
      <div>
        <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5 text-amber-600" />
          Rozetler
          {badgeData && (
            <span className="text-xs font-medium text-slate-500 ml-1">
              ({earnedCount}/{badgeData.badges.length} kazanıldı)
            </span>
          )}
        </h2>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(badgeData?.badges ?? []).map((badge) => (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border-2 transition-all ${
                  badge.earned
                    ? "bg-amber-50 border-amber-200 shadow-sm hover:shadow-md"
                    : "bg-slate-50 border-slate-200 opacity-60 grayscale"
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl mb-3 shadow-sm border border-amber-100">
                  {badge.earned ? badge.emoji : "🔒"}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{badge.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    badge.earned ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

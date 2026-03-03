"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, BadgeData, LeaderboardEntry } from "@/lib/api";
import { Trophy, Award, TrendingUp, Star, RefreshCw, Crown, AlertCircle } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function RozetPage() {
  const { token } = useAuth();

  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [badges, board] = await Promise.all([
        api.getBadges(token),
        api.getLeaderboard(token, period),
      ]);
      setBadgeData(badges);
      setLeaderboard(board);
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
      const board = await api.getLeaderboard(token, period);
      setLeaderboard(board);
    } catch (e) {
      setError((e as Error).message || "Sıralama yüklenemedi");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [token, period]);

  useEffect(() => { loadData(); }, [loadData]);

  // period değiştiğinde sadece leaderboard'u yeniden yükle
  useEffect(() => {
    if (!loading && token) {
      loadLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const xpPct = badgeData ? Math.round(((badgeData.xp ?? 0) / (badgeData.xp_next_level ?? 100)) * 100) : 0;
  const earnedCount = badgeData?.badges.filter((b) => b.earned).length ?? 0;

  return (
    <div className="p-8 lg:p-12 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Motivasyon & Başarılar</h1>
          <p className="text-slate-600 mt-1">Rozetler, haftalık sıralama ve seviye sistemi</p>
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
          <button onClick={loadData} className="ml-auto text-red-600 font-semibold hover:underline text-xs">
            Yenile
          </button>
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
                {Math.floor((badgeData.weekly_champion.study_minutes ?? 0) / 60)}s {(badgeData.weekly_champion.study_minutes ?? 0) % 60}dk çalışma
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

        {loading || leaderboardLoading ? (
          <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Sıralama verisi bulunamadı.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaderboard.map((entry) => (
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
                <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                  {entry.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${entry.is_current_user ? "text-teal-700" : "text-slate-900"}`}>
                    {entry.name}
                    {entry.is_current_user && <span className="ml-2 text-xs text-teal-500">(Sen)</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {Math.floor((entry.study_minutes ?? 0) / 60)}s {(entry.study_minutes ?? 0) % 60}dk çalışma
                  </p>
                </div>
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
        ) : (badgeData?.badges ?? []).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            Henüz rozet verisi yok.
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
                  {badge.earned ? (badge.emoji ?? "✅") : "🔒"}
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

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { BarChart3, AlertCircle, Clock, TrendingDown, RefreshCw } from "lucide-react";

type StudentRow = {
  id: number;
  name: string;
  net: number;
  hedef: number;
  risk: "green" | "yellow" | "red";
};

function Skeleton({ className }: { className?: string }) {
  return <div className={"bg-slate-100 rounded-xl animate-pulse " + (className ?? "")} />;
}

export default function AnalizPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return; }
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await api.getRiskStudents(token);
      setStudents(res.map((s) => ({
        id: s.id, name: s.name,
        net: s.current_net ?? 0, hedef: s.target_net ?? 50,
        risk: (s.risk_level ?? "green") as "green" | "yellow" | "red",
      })));
    } catch { setStudents([]); }
    setLoading(false); setRefreshing(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const riskDot = (r: "green" | "yellow" | "red") =>
    "w-3 h-3 rounded-full " + (r === "green" ? "bg-emerald-500" : r === "yellow" ? "bg-amber-500" : "bg-red-500");

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analiz Merkezi</h1>
          <p className="text-slate-600 mt-1">Ogrenci bazlı net, kazanim bazlı hata, en zor konular, cozum sureleri</p>
        </div>
        <button onClick={() => loadData(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors">
          <RefreshCw className={"w-4 h-4 " + (refreshing ? "animate-spin" : "")} /> Yenile
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ogrenci bazli net */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-teal-600" /> Ogrenci Bazli Net
          </h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : students.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Henuz ogrenci verisi yok.</p>
          ) : (
            <div className="space-y-3">
              {students.map((s) => (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                  <div className={riskDot(s.risk)} />
                  <span className="flex-1 font-medium text-slate-900 text-sm">{s.name}</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{s.net}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {s.hedef}</span>
                  </div>
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full " + (s.risk === "green" ? "bg-teal-500" : s.risk === "yellow" ? "bg-amber-500" : "bg-red-500")} style={{ width: Math.min((s.net / Math.max(s.hedef, 1)) * 100, 100) + "%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kazanim bazli hata */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" /> Kazanim Bazli Hata
          </h2>
          <p className="text-sm text-slate-600 mb-5">En cok hata yapilan kazanimlar</p>
          <p className="text-slate-400 text-sm text-center py-6">Kazanim analizi verisi icin ogrencilerinizin deneme cozmesi gerekmektedir.</p>
        </div>

        {/* En zor konular */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" /> En Zor Konular
          </h2>
          <p className="text-sm text-slate-600 mb-5">%65+ yanlis orani = Turkiye geneli zor kazanim</p>
          <p className="text-slate-400 text-sm text-center py-6">Yeterli soru cozum verisi biriktiginde konular burada gorunecektir.</p>
        </div>

        {/* Cozum suresi analizi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-teal-600" /> Cozum Suresi Analizi
          </h2>
          <p className="text-sm text-slate-600 mb-5">Ortalama cozum suresi (dk/soru)</p>
          <p className="text-slate-400 text-sm text-center py-6">Cozum suresi verisi birikmesi icin daha fazla soru cozumu gereklidir.</p>
        </div>
      </div>

      {/* Sinif net dagilimi */}
      {!loading && students.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-4">Sinif Net Dagilimi</h2>
          <div className="flex items-end gap-2 h-32">
            {students.map((s) => (
              <div key={s.id} className="flex-1 flex flex-col items-center gap-2">
                <div className={"w-full rounded-t-xl min-h-[8px] " + (s.risk === "green" ? "bg-teal-500" : s.risk === "yellow" ? "bg-amber-500" : "bg-red-500")} style={{ height: (s.net / 100 * 100) + "%" }} title={s.name + ": " + s.net} />
                <span className="text-[10px] text-slate-500 truncate w-full text-center">{s.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

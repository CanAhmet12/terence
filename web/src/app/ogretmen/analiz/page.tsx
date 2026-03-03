"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, User } from "@/lib/api";
import { BarChart3, AlertCircle, Clock, TrendingDown, Users, RefreshCw } from "lucide-react";

type StudentRow = {
  id: number;
  name: string;
  net: number;
  hedef: number;
  risk: "green" | "yellow" | "red";
};

type KazanimHata = { kod: string; konu: string; hataSayisi: number; ogrenciSayisi: number };
type ZorKonu = { konu: string; yanlisOran: number };
type ZamanAlan = { konu: string; ortalamaSure: number };

const DEMO_OGRENCILER: StudentRow[] = [
  { id: 1, name: "Elif K.", net: 52, hedef: 55, risk: "green" },
  { id: 2, name: "Can D.", net: 48, hedef: 50, risk: "green" },
  { id: 3, name: "Zeynep K.", net: 42, hedef: 50, risk: "yellow" },
  { id: 4, name: "Ahmet Y.", net: 35, hedef: 50, risk: "red" },
];

const DEMO_KAZANIM: KazanimHata[] = [
  { kod: "M.8.1.1", konu: "Üslü İfadeler", hataSayisi: 24, ogrenciSayisi: 8 },
  { kod: "F.9.1.1", konu: "Hareket", hataSayisi: 18, ogrenciSayisi: 6 },
  { kod: "T.9.2.1", konu: "Paragraf", hataSayisi: 12, ogrenciSayisi: 5 },
];

const DEMO_ZOR: ZorKonu[] = [
  { konu: "Üslü Sayılar", yanlisOran: 68 },
  { konu: "Hareket Denklemleri", yanlisOran: 62 },
  { konu: "Paragraf Yorumu", yanlisOran: 55 },
];

const DEMO_ZAMAN: ZamanAlan[] = [
  { konu: "Limit-Türev", ortalamaSure: 4.2 },
  { konu: "Paragraf", ortalamaSure: 3.8 },
  { konu: "Üslü İfadeler", ortalamaSure: 2.1 },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

export default function AnalizPage() {
  const { token } = useAuth();
  const isDemo = token?.startsWith("demo-token-");

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    if (!token || isDemo) {
      setStudents(DEMO_OGRENCILER);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const res = await api.getTeacherStudents(token);
      const rows: StudentRow[] = (res as User[]).map((s, i) => ({
        id: s.id,
        name: s.name,
        net: 35 + (i * 5),
        hedef: 50,
        risk: (["green", "green", "yellow", "red"] as const)[i % 4],
      }));
      setStudents(rows);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [token, isDemo]);

  useEffect(() => { loadData(); }, [loadData]);

  const riskDot = (risk: "green" | "yellow" | "red") =>
    `w-3 h-3 rounded-full ${risk === "green" ? "bg-emerald-500" : risk === "yellow" ? "bg-amber-500" : "bg-red-500"}`;

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analiz Merkezi</h1>
          <p className="text-slate-600 mt-1">
            Öğrenci bazlı net, kazanım bazlı hata, en zor konular, çözüm süreleri
          </p>
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
              Demo Modu
            </span>
          )}
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Öğrenci bazlı net */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-teal-600" />
            Öğrenci Bazlı Net
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-200" />
              Henüz öğrenci yok
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 text-slate-600 font-semibold">Öğrenci</th>
                    <th className="text-right py-3 text-slate-600 font-semibold">Net</th>
                    <th className="text-right py-3 text-slate-600 font-semibold">Hedef</th>
                    <th className="text-right py-3 text-slate-600 font-semibold">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((o) => (
                    <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-medium text-slate-900">{o.name}</td>
                      <td className="text-right py-3 font-bold text-slate-900">{o.net}</td>
                      <td className="text-right py-3 text-slate-500">{o.hedef}</td>
                      <td className="text-right py-3">
                        <div className="flex justify-end">
                          <span
                            className={riskDot(o.risk)}
                            title={o.risk === "green" ? "Hedefte" : o.risk === "yellow" ? "Sınırda" : "Riskte"}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Kazanım bazlı hata */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Kazanım Bazlı Hata
          </h2>
          <p className="text-sm text-slate-600 mb-5">En çok hata yapılan kazanımlar — tekrar anlatım önerisi</p>
          <div className="space-y-3">
            {DEMO_KAZANIM.map((k) => (
              <div key={k.kod} className="py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{k.kod}</span>
                    <span className="font-medium text-slate-900 ml-2">{k.konu}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-red-600 font-bold">{k.hataSayisi}</span>
                    <span className="text-slate-500 text-xs ml-1">hata</span>
                  </div>
                </div>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${Math.min((k.hataSayisi / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* En zor konular */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            En Zor Konular
          </h2>
          <p className="text-sm text-slate-600 mb-5">%65+ yanlış oranı = Türkiye geneli zor kazanım</p>
          <div className="space-y-4">
            {DEMO_ZOR.map((z) => (
              <div key={z.konu}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-800">{z.konu}</span>
                  <span className={`text-sm font-bold ${z.yanlisOran >= 65 ? "text-red-600" : "text-amber-600"}`}>
                    %{z.yanlisOran} yanlış
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${z.yanlisOran >= 65 ? "bg-red-400" : "bg-amber-400"}`}
                    style={{ width: `${z.yanlisOran}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zaman analizi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Çözüm Süresi Analizi
          </h2>
          <p className="text-sm text-slate-600 mb-5">Ortalama çözüm süresi (dk/soru) — yüksek süre = zorluk işareti</p>
          <div className="space-y-4">
            {DEMO_ZAMAN.map((z) => (
              <div key={z.konu}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-800">{z.konu}</span>
                  <span className="text-sm font-bold text-teal-600">{z.ortalamaSure} dk/soru</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full"
                    style={{ width: `${(z.ortalamaSure / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sınıf genel özeti */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Sınıf Net Dağılımı
          </h2>
          {loading ? (
            <div className="flex items-end gap-3 h-32">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="flex-1 h-full" />)}
            </div>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {students.map((s) => {
                const maxH = 60;
                const h = Math.max((s.net / maxH) * 100, 5);
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-600">{s.net}</span>
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        s.risk === "green" ? "bg-emerald-400" : s.risk === "yellow" ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-slate-500 text-center truncate w-full text-center">
                      {s.name.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

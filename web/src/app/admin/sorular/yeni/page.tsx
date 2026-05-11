"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Save, Layers, FileJson } from "lucide-react";

const SUBJECTS = [
  "Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Edebiyat", "Tarih", "Coğrafya",
  "Felsefe", "İngilizce", "Geometri", "Din Kültürü", "Diğer",
];

type Tab = "form" | "bulk";

export default function AdminSoruYeniPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const [questionText, setQuestionText] = useState("");
  const [subject, setSubject] = useState("Matematik");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [type, setType] = useState<"classic" | "new_gen" | "paragraph">("classic");
  const [examType, setExamType] = useState("Genel");
  const [grade, setGrade] = useState<string>("");
  const [kazanimCode, setKazanimCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [opts, setOpts] = useState(["", "", "", "", ""]);
  const [correctIdx, setCorrectIdx] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    const options = opts.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) {
      setError("En az iki şık metni girin.");
      return;
    }
    if (correctIdx >= options.length) {
      setError("Doğru şık seçimi geçersiz.");
      return;
    }
    setSaving(true);
    try {
      await api.createAdminQuestion({
        question_text: questionText,
        subject,
        difficulty,
        type,
        exam_type: examType,
        grade: grade ? Number(grade) : undefined,
        kazanim_code: kazanimCode || undefined,
        explanation: explanation || undefined,
        options,
        correct_option: correctIdx,
      } as Parameters<typeof api.createAdminQuestion>[0]);
      router.push("/admin/sorular");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  const runBulk = async () => {
    if (!token) return;
    setError(null);
    setBulkResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(bulkJson);
    } catch {
      setError("JSON ayrıştırılamadı.");
      return;
    }
    if (!Array.isArray(parsed)) {
      setError("Kök öğe bir dizi (array) olmalıdır.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.bulkCreateAdminQuestions(parsed as Record<string, unknown>[]);
      setBulkResult(`${res.created_count} soru oluşturuldu. Hata satırı: ${res.errors?.length ?? 0}.`);
      if (res.errors?.length === 0 && res.created_count > 0) {
        router.push("/admin/sorular");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Toplu yükleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10 overflow-x-hidden">
      <Link href="/admin/sorular" className="inline-flex items-center gap-2 text-slate-600 hover:text-cyan-600 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        Soru listesine dön
      </Link>

      <div className="flex gap-2 mb-8">
        <button
          type="button"
          onClick={() => setTab("form")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
            tab === "form" ? "border-cyan-500 bg-cyan-50 text-cyan-800" : "border-slate-200 text-slate-600"
          }`}
        >
          <Save className="w-4 h-4" />
          Tek soru
        </button>
        <button
          type="button"
          onClick={() => setTab("bulk")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${
            tab === "bulk" ? "border-violet-500 bg-violet-50 text-violet-800" : "border-slate-200 text-slate-600"
          }`}
        >
          <FileJson className="w-4 h-4" />
          Toplu JSON
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">{error}</div>
      )}

      {tab === "form" ? (
        <form onSubmit={submit} className="space-y-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Yeni soru</h1>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Soru metni</label>
            <textarea
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ders</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm">
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Zorluk</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm">
                <option value="easy">Kolay</option>
                <option value="medium">Orta</option>
                <option value="hard">Zor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Soru tipi</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm">
                <option value="classic">Klasik</option>
                <option value="new_gen">Yeni nesil</option>
                <option value="paragraph">Paragraf</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sınav türü</label>
              <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm">
                {["LGS", "TYT", "AYT", "TYT-AYT", "KPSS", "Genel"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sınıf (opsiyonel)</label>
              <input type="number" min={1} max={12} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Örn: 9" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kazanım kodu</label>
              <input value={kazanimCode} onChange={(e) => setKazanimCode(e.target.value.toUpperCase())} placeholder="M.9.1.1" className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Şıklar (A–E, en az 2 dolu)</label>
            <div className="space-y-2">
              {opts.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name="correct" checked={correctIdx === i} onChange={() => setCorrectIdx(i)} className="accent-cyan-600" />
                  <span className="w-6 text-xs font-bold text-slate-500">{String.fromCharCode(65 + i)})</span>
                  <input
                    value={v}
                    onChange={(e) => setOpts((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Çözüm / açıklama</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Kaydet
          </button>
        </form>
      ) : (
        <div className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Layers className="w-8 h-8 text-violet-600 shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Toplu soru (JSON)</h1>
              <p className="text-sm text-slate-600 mt-1">
                Her öğe <code className="text-xs bg-slate-100 px-1 rounded">createAdminQuestion</code> ile aynı alanlara sahip olmalıdır:
                question_text, options (dizi), correct_option (0 tabanlı indeks), subject, difficulty, type?, exam_type?, grade?, kazanim_code?, explanation?
              </p>
            </div>
          </div>
          <textarea
            value={bulkJson}
            onChange={(e) => setBulkJson(e.target.value)}
            rows={16}
            placeholder={`[\n  {\n    "question_text": "...",\n    "options": ["A şıkkı", "B şıkkı", "C şıkkı"],\n    "correct_option": 0,\n    "subject": "Matematik",\n    "difficulty": "medium",\n    "exam_type": "TYT",\n    "grade": 12\n  }\n]`}
            className="w-full font-mono text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none"
          />
          {bulkResult && <p className="text-sm text-cyan-700 font-medium">{bulkResult}</p>}
          <button
            type="button"
            onClick={runBulk}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
            Toplu yükle (en fazla 80)
          </button>
        </div>
      )}
    </div>
  );
}

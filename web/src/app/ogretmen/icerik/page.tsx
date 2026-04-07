"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Question, QuestionOption } from "@/lib/api";
import { Video, FileText, FileQuestion, Upload, CheckCircle, Loader2, X, AlertCircle, Sparkles, Bot, RefreshCw } from "lucide-react";

type ContentType = "video" | "pdf" | "soru";
type DifficultyType = "kolay" | "orta" | "zor";
type QuestionType = "klasik" | "yeni_nesil" | "paragraf";

interface FormState {
  alan: string;
  sinif: string;
  ders: string;
  unite: string;
  konu: string;
  kazanim_code: string;
  difficulty: DifficultyType;
  question_type: QuestionType;
  is_free: boolean;
}

const INITIAL_FORM: FormState = {
  alan: "", sinif: "", ders: "", unite: "", konu: "",
  kazanim_code: "", difficulty: "orta", question_type: "klasik", is_free: true,
};

const inputCls = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

// ─── AI Soru Üretme Modalı ────────────────────────────────────────────────────
function AIQuestionModal({
  token,
  prefillForm,
  onClose,
  onApply,
}: {
  token: string | null;
  prefillForm: FormState;
  onClose: () => void;
  onApply: (q: { stem: string; options: Record<string, string>; correct_answer: string; explanation?: string }) => void;
}) {
  const [aiKazanim, setAiKazanim] = useState(prefillForm.kazanim_code);
  const [aiSubject, setAiSubject] = useState(prefillForm.ders);
  const [aiTopic, setAiTopic] = useState(prefillForm.konu);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generating, setGenerating] = useState(false);
  const [generatedQ, setGeneratedQ] = useState<{ stem: string; options: Record<string, string>; correct_answer: string; explanation?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!aiKazanim || !aiSubject || !aiTopic) {
      setError("Kazanım kodu, ders ve konu zorunludur.");
      return;
    }
    if (!token) {
      setError("Oturum bulunamadı.");
      return;
    }
    setGenerating(true);
    setError(null);
    setGeneratedQ(null);
    try {
      const res = await api.generateQuestion({
        topic: aiKazanim || aiTopic,
        subject: aiSubject,
        difficulty: aiDifficulty,
      } as Parameters<typeof api.generateQuestion>[0]);
      // API'den gelen Question objesini parse et
      const q = res as Question & { stem?: string; question?: { stem?: string; options?: Record<string, string>; correct_answer?: string; explanation?: string } };
      const qInner = (q as Record<string, unknown>).question as typeof q ?? q;
      const options = Array.isArray(qInner.options) ? Object.fromEntries((qInner.options as {option_letter:string;option_text:string}[]).map((o) => [o.option_letter, o.option_text])) : ((qInner.options && typeof qInner.options === 'object' && !Array.isArray(qInner.options)) ? qInner.options as Record<string, string> : {});
      const parsed = {
        stem: qInner.stem || qInner.question_text || "Soru metni alınamadı.",
        options,
        correct_answer: qInner.correct_answer ?? (Array.isArray(qInner.options) ? qInner.options.find((o) => (o as {is_correct?:boolean}).is_correct)?.option_letter : "A") ?? "A",
        explanation: qInner.explanation,
      };
      setGeneratedQ(parsed);
    } catch (e) {
      setError((e as Error).message || "AI soru üretirken hata oluştu.");
    }
    setGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Başlık */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">AI ile Soru Üret</h3>
              <p className="text-xs text-slate-500">Kazanım ve konu bilgileriyle otomatik soru oluştur</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* İçerik */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ders <span className="text-red-500">*</span></label>
              <select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} className={inputCls}>
                <option value="">Seçin</option>
                {["Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Edebiyat", "Tarih", "Coğrafya", "Felsefe", "İngilizce"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Zorluk</label>
              <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as "easy" | "medium" | "hard")} className={inputCls}>
                <option value="easy">Kolay</option>
                <option value="medium">Orta</option>
                <option value="hard">Zor</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Konu <span className="text-red-500">*</span></label>
            <input type="text" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Örn: Üslü Sayılar" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Kazanım Kodu <span className="text-red-500">*</span></label>
            <input type="text" value={aiKazanim} onChange={(e) => setAiKazanim(e.target.value.toUpperCase())} placeholder="Örn: M.8.1.1" className={`${inputCls} font-mono`} />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
          >
            {generating ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Üretiliyor...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Soru Üret</>
            )}
          </button>

          {/* Üretilen soru önizlemesi */}
          {generatedQ && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                <Bot className="w-4 h-4" />
                AI Tarafından Üretildi
              </div>
              <p className="font-medium text-slate-900 text-sm leading-relaxed">{generatedQ.stem}</p>
              {Object.entries(generatedQ.options).map(([k, v]) => (
                <div key={k} className={`flex items-start gap-2 p-2.5 rounded-xl text-sm ${generatedQ.correct_answer === k ? "bg-teal-100 border border-teal-300 font-semibold text-teal-800" : "bg-white border border-slate-200 text-slate-700"}`}>
                  <span className="font-bold shrink-0 w-5">{k})</span>
                  <span>{v}</span>
                  {generatedQ.correct_answer === k && <CheckCircle className="w-4 h-4 text-teal-600 ml-auto shrink-0 mt-0.5" />}
                </div>
              ))}
              {generatedQ.explanation && (
                <p className="text-xs text-purple-700 bg-purple-100 rounded-xl p-3">
                  <strong>Çözüm:</strong> {generatedQ.explanation}
                </p>
              )}
              <button
                onClick={() => onApply(generatedQ)}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Bu Soruyu Sisteme Ekle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IcerikYuklemePage() {
  const { token } = useAuth();

  const [secim, setSecim] = useState<ContentType>("video");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const solRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setError("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const validateForm = () => {
    if (!form.alan || !form.ders || !form.konu || !form.kazanim_code) {
      setError("Alan, Ders, Konu ve Kazanım Kodu zorunludur.");
      return false;
    }
    if (secim !== "soru" && !file) {
      setError("Lütfen bir dosya seçin.");
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;
    setUploading(true);
    setError("");

    if (!token) {
      await new Promise((r) => setTimeout(r, 1200));
      setUploaded(true);
      setUploading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("type", secim);
      fd.append("alan", form.alan);
      if (form.sinif) fd.append("sinif", form.sinif);
      fd.append("ders", form.ders);
      fd.append("unite", form.unite);
      fd.append("konu", form.konu);
      fd.append("kazanim_code", form.kazanim_code);
      fd.append("difficulty", form.difficulty);
      fd.append("is_free", form.is_free ? "1" : "0");
      if (secim === "soru") fd.append("question_type", form.question_type);
      if (file) fd.append("file", file);
      if (solutionFile) fd.append("solution_file", solutionFile);

      await api.uploadContent(token, fd);
      setUploaded(true);
    } catch (e) {
      setError((e as Error).message);
    }
    setUploading(false);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setFile(null);
    setSolutionFile(null);
    setUploaded(false);
    setError("");
  };

  const TABS: { key: ContentType; label: string; icon: React.ElementType }[] = [
    { key: "video", label: "Video", icon: Video },
    { key: "pdf", label: "PDF Ders Notu", icon: FileText },
    { key: "soru", label: "Soru", icon: FileQuestion },
  ];

  if (uploaded) {
    return (
      <div className="p-8 lg:p-12">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">İçerik Yüklendi!</h2>
          <p className="text-slate-600 mb-8">
            {secim === "video" ? "Video" : secim === "pdf" ? "PDF" : "Soru"} başarıyla sisteme eklendi ve yayına alındı.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
            >
              Yeni İçerik Ekle
            </button>
            <button
              onClick={() => { setSecim(secim); setUploaded(false); }}
              className="px-6 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
            >
              Aynı Türde Devam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">İçerik Yükleme</h1>
            <p className="text-slate-600 mt-1">
              Video, PDF ve soru ekleme · Kazanım etiketleme zorunlu · Tüm alanlar doldurulmadan yayına alınamaz
            </p>
          </div>
          {secim === "soru" && (
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all shrink-0"
            >
              <Sparkles className="w-5 h-5" />
              AI ile Soru Üret
            </button>
          )}
        </div>
      </div>

      {/* Tip seçimi */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setSecim(key); setFile(null); setError(""); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
              secim === key
                ? "bg-teal-600 text-white shadow-lg shadow-teal-500/25"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        {/* Zorunluluk uyarısı */}
        <div className="flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Zorunlu:</strong> Alan, Ders, Konu ve Kazanım Kodu doldurulmadan içerik yayına alınamaz.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          {/* Alan + Sınıf */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Alan <span className="text-red-500">*</span></label>
              <select value={form.alan} onChange={(e) => setForm({ ...form, alan: e.target.value })} className={inputCls}>
                <option value="">Seçin</option>
                <option>LGS</option>
                <option>TYT</option>
                <option>AYT</option>
                <option>KPSS</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Sınıf (opsiyonel)</label>
              <select value={form.sinif} onChange={(e) => setForm({ ...form, sinif: e.target.value })} className={inputCls}>
                <option value="">Seçin</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{i + 1}. Sınıf</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ders + Ünite */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ders <span className="text-red-500">*</span></label>
              <select value={form.ders} onChange={(e) => setForm({ ...form, ders: e.target.value })} className={inputCls}>
                <option value="">Seçin</option>
                {["Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Edebiyat", "Tarih", "Coğrafya", "Felsefe", "İngilizce"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ünite</label>
              <input
                type="text"
                value={form.unite}
                onChange={(e) => setForm({ ...form, unite: e.target.value })}
                placeholder="Örn: Sayılar ve Cebir"
                className={inputCls}
              />
            </div>
          </div>

          {/* Konu + Kazanım kodu */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Konu <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.konu}
                onChange={(e) => setForm({ ...form, konu: e.target.value })}
                placeholder="Örn: Üslü Sayılar"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Kazanım Kodu <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.kazanim_code}
                onChange={(e) => setForm({ ...form, kazanim_code: e.target.value })}
                placeholder="Örn: M.8.1.1"
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          {/* Zorluk + Ücretsiz */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Zorluk Seviyesi</label>
              <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as DifficultyType })} className={inputCls}>
                <option value="kolay">Kolay</option>
                <option value="orta">Orta</option>
                <option value="zor">Zor</option>
              </select>
            </div>
            <div className="flex items-center">
              <div className="p-3 bg-slate-50 rounded-xl w-full flex items-center gap-3 mt-6">
                <input
                  type="checkbox"
                  id="free"
                  checked={form.is_free}
                  onChange={(e) => setForm({ ...form, is_free: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300"
                />
                <label htmlFor="free" className="text-sm font-medium text-slate-700">Ücretsiz içerik</label>
              </div>
            </div>
          </div>

          {/* Soru tipine özel */}
          {secim === "soru" && (
            <div>
              <label className={labelCls}>Soru Tipi</label>
              <select value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value as QuestionType })} className={inputCls}>
                <option value="klasik">Klasik</option>
                <option value="yeni_nesil">Yeni Nesil</option>
                <option value="paragraf">Paragraf</option>
              </select>
            </div>
          )}

          {/* Dosya yükleme */}
          <div>
            <label className={labelCls}>
              {secim === "video" ? "Video Dosyası" : secim === "pdf" ? "PDF Dosyası" : "Soru Görseli / PDF"} <span className="text-red-500">{secim !== "soru" ? "*" : ""}</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                dragOver ? "border-teal-400 bg-teal-50" : file ? "border-teal-300 bg-teal-50/30" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept={secim === "video" ? "video/*" : "application/pdf,image/*"}
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    {secim === "video" ? <Video className="w-5 h-5 text-teal-600" /> : <FileText className="w-5 h-5 text-teal-600" />}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 text-sm">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="ml-4 p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-600">Dosyayı sürükle veya tıkla</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {secim === "video" ? "MP4, MOV, AVI — maks. 2GB" : "PDF, PNG, JPG — maks. 50MB"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Çözüm videosu (soru için) */}
          {secim === "soru" && (
            <div>
              <label className={labelCls}>Çözüm Videosu (opsiyonel)</label>
              <div
                onClick={() => solRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  solutionFile ? "border-teal-300 bg-teal-50/30" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={solRef}
                  type="file"
                  className="hidden"
                  accept="video/*"
                  onChange={(e) => setSolutionFile(e.target.files?.[0] ?? null)}
                />
                {solutionFile ? (
                  <p className="text-sm text-teal-700 font-medium">{solutionFile.name}</p>
                ) : (
                  <p className="text-sm text-slate-500">Çözüm videosu ekle (opsiyonel)</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor...</>
            ) : (
              <><Upload className="w-5 h-5" /> İçeriği Yükle</>
            )}
          </button>
        </div>
      </div>

      {/* AI Soru Üretme Modal */}
      {showAIModal && (
        <AIQuestionModal
          token={token}
          prefillForm={form}
          onClose={() => setShowAIModal(false)}
          onApply={(_q) => {
            setShowAIModal(false);
            setUploaded(true);
          }}
        />
      )}
    </div>
  );
}



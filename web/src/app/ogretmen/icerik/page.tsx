"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Question, TeacherCurriculumTopicRow } from "@/lib/api";
import { Video, FileText, Upload, CheckCircle, Loader2, X, AlertCircle, Sparkles, Bot, RefreshCw, Search, ImageIcon } from "lucide-react";

type ContentType = "video" | "pdf";

const inputCls =
  "w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all bg-white";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── AI Soru Üretme Modalı (yalnızca taslak; soru bankasına otomatik yazılmaz) ─
function AIQuestionModal({
  token,
  topicHint,
  onClose,
  onApply,
}: {
  token: string | null;
  topicHint: string;
  onClose: () => void;
  onApply: (q: { stem: string; options: Record<string, string>; correct_answer: string; explanation?: string }) => void;
}) {
  const [aiKazanim, setAiKazanim] = useState("");
  const [aiSubject, setAiSubject] = useState("");
  const [aiTopic, setAiTopic] = useState(topicHint);
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generating, setGenerating] = useState(false);
  const [generatedQ, setGeneratedQ] = useState<{
    stem: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation?: string;
  } | null>(null);
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
      const q = res as Question & {
        stem?: string;
        question?: { stem?: string; options?: Record<string, string> | unknown[]; correct_answer?: string; explanation?: string };
      };
      const qInner = ((q as Record<string, unknown>).question as typeof q) ?? q;
      const options = Array.isArray(qInner.options)
        ? Object.fromEntries(
            (qInner.options as { option_letter: string; option_text: string }[]).map((o) => [o.option_letter, o.option_text])
          )
        : qInner.options && typeof qInner.options === "object" && !Array.isArray(qInner.options)
          ? (qInner.options as Record<string, string>)
          : {};
      const parsed = {
        stem: qInner.stem || qInner.question_text || "Soru metni alınamadı.",
        options,
        correct_answer:
          qInner.correct_answer ??
          (Array.isArray(qInner.options)
            ? qInner.options.find((o) => (o as { is_correct?: boolean }).is_correct)?.option_letter
            : "A") ??
          "A",
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">AI ile Soru Taslağı</h3>
              <p className="text-xs text-slate-500">Kopyalayıp dışarıda kullanın; soru bankasına otomatik eklenmez.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Ders <span className="text-red-500">*</span>
              </label>
              <select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} className={inputCls}>
                <option value="">Seçin</option>
                {["Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Edebiyat", "Tarih", "Coğrafya", "Felsefe", "İngilizce"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Zorluk</label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className={inputCls}
              >
                <option value="easy">Kolay</option>
                <option value="medium">Orta</option>
                <option value="hard">Zor</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>
              Konu <span className="text-red-500">*</span>
            </label>
            <input type="text" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Örn: Üslü Sayılar" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>
              Kazanım Kodu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={aiKazanim}
              onChange={(e) => setAiKazanim(e.target.value.toUpperCase())}
              placeholder="Örn: M.8.1.1"
              className={`${inputCls} font-mono`}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Üretiliyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Soru Üret
              </>
            )}
          </button>

          {generatedQ && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                <Bot className="w-4 h-4" />
                AI Tarafından Üretildi
              </div>
              <p className="font-medium text-slate-900 text-sm leading-relaxed">{generatedQ.stem}</p>
              {Object.entries(generatedQ.options).map(([k, v]) => (
                <div
                  key={k}
                  className={`flex items-start gap-2 p-2.5 rounded-xl text-sm ${
                    generatedQ.correct_answer === k
                      ? "bg-teal-100 border border-teal-300 font-semibold text-teal-800"
                      : "bg-white border border-slate-200 text-slate-700"
                  }`}
                >
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
                type="button"
                onClick={() => onApply(generatedQ)}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Kapat
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
  const [topicQuery, setTopicQuery] = useState("");
  const debouncedQuery = useDebouncedValue(topicQuery, 350);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<TeacherCurriculumTopicRow[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TeacherCurriculumTopicRow | null>(null);
  const [displayTitle, setDisplayTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbObjectUrl, setThumbObjectUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(thumbnailFile);
    setThumbObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [thumbnailFile]);

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

  useEffect(() => {
    if (!token) {
      setSearchResults([]);
      return;
    }
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    api
      .searchCurriculumTopics(q)
      .then((rows) => {
        if (!cancelled) setSearchResults(rows);
      })
      .catch(() => {
        if (!cancelled) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, token]);

  const validateForm = (): boolean => {
    if (!token) {
      setError("Oturum açmanız gerekir.");
      return false;
    }
    if (!selectedTopic) {
      setError("Listeden bir müfredat konusu seçin (arama en az 2 karakter).");
      return false;
    }
    if (!file) {
      setError(secim === "video" ? "Video dosyasını bilgisayarınızdan seçin." : "PDF dosyasını bilgisayarınızdan seçin.");
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;
    if (!selectedTopic || !file) return;

    setUploading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("curriculum_topic_id", String(selectedTopic.id));
      fd.append("content_type", secim);
      if (displayTitle.trim()) fd.append("title", displayTitle.trim());
      fd.append("is_free", "1");
      fd.append("file", file);
      if (secim === "video" && thumbnailFile) {
        fd.append("thumbnail", thumbnailFile);
      }

      const res = await api.uploadCurriculumContent(fd);
      if (!res.success && (res as { error?: boolean }).error) {
        throw new Error((res as { message?: string }).message || "Yükleme başarısız.");
      }
      setUploaded(true);
    } catch (e) {
      setError((e as Error).message || "Yükleme sırasında hata oluştu.");
    }
    setUploading(false);
  };

  const resetForm = () => {
    setTopicQuery("");
    setSearchResults([]);
    setSelectedTopic(null);
    setDisplayTitle("");
    setFile(null);
    setThumbnailFile(null);
    setUploaded(false);
    setError("");
  };

  const TABS: { key: ContentType; label: string; icon: React.ElementType }[] = [
    { key: "video", label: "Video", icon: Video },
    { key: "pdf", label: "PDF ders notu", icon: FileText },
  ];

  if (uploaded) {
    return (
      <div className="p-8 lg:p-12">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">İçerik müfredata bağlandı</h2>
          <p className="text-slate-600 mb-8">
            {secim === "video" ? "Video" : "PDF"} kaydı oluşturuldu. Kapak görseli sunucuda otomatik oluşturuldu; isterseniz bir sonraki yüklemede özel kapak
            yükleyebilirsiniz.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
            >
              Yeni içerik ekle
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="w-full min-w-0 overflow-x-hidden px-3 py-6 sm:px-4 sm:py-8 lg:px-6">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Müfredat medyası</h1>
              <p className="text-slate-500 mt-1 font-medium max-w-xl">
                Yalnızca bilgisayarınızdan dosya yüklenir (harici link yok). Önce müfredat konusunu seçin, ardından video veya PDF dosyasını ekleyin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all shrink-0"
            >
              <Sparkles className="w-5 h-5" />
              AI soru taslağı
            </button>
          </div>
        </div>

        <ol className="flex flex-wrap gap-3 mb-8 text-sm font-semibold text-slate-600">
          <li className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white text-xs">1</span>
            Tür: video veya PDF
          </li>
          <li className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white text-xs">2</span>
            Müfredat konusu
          </li>
          <li className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white text-xs">3</span>
            Dosya yükle
          </li>
        </ol>

        <div className="flex gap-3 mb-8 flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSecim(key);
                setFile(null);
                setThumbnailFile(null);
                setError("");
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                secim === key ? "bg-teal-600 text-white shadow-lg shadow-teal-500/25" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        <div className="max-w-2xl space-y-6">
          <div className="flex items-start gap-2.5 p-4 bg-sky-50 border border-sky-100 rounded-2xl">
            <Search className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <p className="text-sm text-sky-900">
              Konu adı veya MEB kodu ile arayın; çıkan listeden <strong>tam müfredat satırını</strong> seçin. Soru bankası ve toplu kitap içeriği yönetimi{" "}
              <strong>yönetici panelinden</strong> yapılır.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <label className={labelCls}>
                Müfredat konusu ara <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={topicQuery}
                  onChange={(e) => setTopicQuery(e.target.value)}
                  placeholder="Örn: logaritma veya M.10.1.2"
                  className={inputCls}
                  autoComplete="off"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <ul className="mt-2 max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-sm z-10">
                  {searchResults.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTopic(t);
                          setTopicQuery(`${t.subject_name ?? ""} — ${t.title}`);
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-teal-50 text-sm"
                      >
                        <span className="font-semibold text-slate-900">{t.title}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {[t.subject_name, t.unit_title, t.grade ? `${t.grade}. sınıf` : null, t.exam_type].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedTopic && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-teal-50 border border-teal-100 rounded-xl text-sm text-teal-900">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  Seçili konu #{selectedTopic.id}: <strong>{selectedTopic.title}</strong>
                </span>
                <button type="button" className="ml-auto text-teal-700 underline text-xs" onClick={() => setSelectedTopic(null)}>
                  Temizle
                </button>
              </div>
            )}

            <div>
              <label className={labelCls}>Başlık (isteğe bağlı)</label>
              <input
                type="text"
                value={displayTitle}
                onChange={(e) => setDisplayTitle(e.target.value)}
                placeholder="Öğrencide görünecek başlık"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                {secim === "video" ? "Video dosyası" : "PDF dosyası"} <span className="text-red-500">*</span>
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
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
                  accept={secim === "video" ? "video/*" : "application/pdf"}
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
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="ml-4 p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-600">Dosyayı sürükle veya tıkla</p>
                    <p className="text-sm text-slate-400 mt-1">{secim === "video" ? "MP4, WEBM vb. — sunucu limiti ~50 MB" : "Yalnızca PDF"}</p>
                  </>
                )}
              </div>
            </div>

            {secim === "video" && (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 space-y-3">
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-violet-600" /> Özel kapak (isteğe bağlı)
                </p>
                <p className="text-xs text-slate-600">
                  Boş bırakırsanız sunucu otomatik bir kapak üretir. İsterseniz JPEG, PNG veya WebP yükleyebilirsiniz; görsel sıkıştırılarak saklanır.
                </p>
                <div>
                  <label className={labelCls}>Kapak dosyası</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                    className={`${inputCls} py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-violet-800`}
                  />
                </div>
                {thumbObjectUrl && (
                  <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbObjectUrl} alt="Kapak önizleme" className="h-full w-full object-cover object-center" loading="lazy" />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !token}
              className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-70 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" /> Müfredata bağla
                </>
              )}
            </button>
            {!token && <p className="text-center text-sm text-amber-700">Oturum açmadan yükleme yapılamaz.</p>}
          </div>
        </div>
      </div>

      {showAIModal && (
        <AIQuestionModal
          token={token}
          topicHint={selectedTopic?.title ?? ""}
          onClose={() => setShowAIModal(false)}
          onApply={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
}

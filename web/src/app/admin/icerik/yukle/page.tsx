"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type TeacherCurriculumTopicRow } from "@/lib/api";
import { ArrowLeft, Upload, Video, FileText, Loader2, Search, CheckCircle, AlertCircle, ImageIcon } from "lucide-react";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function AdminIcerikYuklePage() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q, 350);
  const [results, setResults] = useState<TeacherCurriculumTopicRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TeacherCurriculumTopicRow | null>(null);
  const [contentType, setContentType] = useState<"video" | "pdf">("video");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrlField, setThumbnailUrlField] = useState("");
  const [thumbObjectUrl, setThumbObjectUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(thumbnailFile);
    setThumbObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [thumbnailFile]);

  const search = useCallback(async () => {
    if (!token || debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const topics = await api.searchCurriculumTopics(debounced.trim(), 40);
      setResults(topics);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [token, debounced]);

  useEffect(() => {
    search();
  }, [search]);

  const upload = async () => {
    if (!token || !selected) {
      setMsg({ type: "err", text: "Konu seçin." });
      return;
    }
    if (!file && !url.trim()) {
      setMsg({ type: "err", text: "Dosya veya URL gerekli." });
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("curriculum_topic_id", String(selected.id));
      fd.append("content_type", contentType);
      if (title.trim()) fd.append("title", title.trim());
      if (url.trim()) fd.append("url", url.trim());
      fd.append("is_free", "1");
      if (file) fd.append("file", file);
      if (contentType === "video") {
        if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
        const tu = thumbnailUrlField.trim();
        if (tu) fd.append("thumbnail_url", tu);
      }
      await api.uploadCurriculumContent(fd);
      setMsg({ type: "ok", text: "İçerik yüklendi." });
      setFile(null);
      setThumbnailFile(null);
      setThumbnailUrlField("");
      setUrl("");
      setTitle("");
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Yükleme başarısız" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-12 max-w-2xl min-w-0 overflow-x-hidden">
      <Link href="/admin/icerik" className="inline-flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-6 font-medium text-sm">
        <ArrowLeft className="w-4 h-4" />
        İçerik listesine dön
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Müfredat içerik yükleme</h1>
      <p className="text-sm text-slate-600 mb-6">
        Öğretmen paneliyle aynı API kullanılır; admin hesabıyla müfredat konusuna video veya PDF bağlayabilirsiniz.
      </p>

      {msg && (
        <div className={`mb-4 p-4 rounded-xl flex items-start gap-2 text-sm font-medium ${msg.type === "ok" ? "bg-teal-50 text-teal-800 border border-teal-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {msg.type === "ok" ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          {msg.text}
        </div>
      )}

      <div className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Search className="w-3.5 h-3.5" /> Müfredat konusu ara (en az 2 karakter)
          </label>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" placeholder="Örn: logaritma veya M.10.1.1" />
          {searching && <p className="text-xs text-slate-400 mt-1">Aranıyor…</p>}
          {results.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
              {results.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(t)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-teal-50/60 ${selected?.id === t.id ? "bg-teal-50 font-semibold text-teal-900" : "text-slate-700"}`}
                  >
                    <span className="block">{t.title}</span>
                    <span className="text-xs text-slate-500">{t.subject_name} · {t.unit_title} · {t.meb_code || "—"}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => { setContentType("video"); setThumbnailFile(null); setThumbnailUrlField(""); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold ${contentType === "video" ? "border-teal-500 bg-teal-50 text-teal-800" : "border-slate-200"}`}>
            <Video className="w-4 h-4" /> Video
          </button>
          <button type="button" onClick={() => { setContentType("pdf"); setThumbnailFile(null); setThumbnailUrlField(""); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold ${contentType === "pdf" ? "border-amber-500 bg-amber-50 text-amber-900" : "border-slate-200"}`}>
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">Başlık (opsiyonel)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Harici URL (opsiyonel)</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm" placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Dosya</label>
          <input type="file" accept={contentType === "video" ? "video/*" : "application/pdf"} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 w-full text-sm" />
        </div>

        {contentType === "video" && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" /> Kapak görseli (isteğe bağlı)
            </p>
            <p className="text-[11px] text-slate-500">Boş bırakırsanız YouTube bağlantılarında otomatik kapak kullanılır. Dosya yüklemesi sunucuda optimize edilir.</p>
            <div>
              <label className="text-xs font-semibold text-slate-600">Kapak URL</label>
              <input
                value={thumbnailUrlField}
                onChange={(e) => setThumbnailUrlField(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                placeholder="https://... görsel adresi"
                disabled={!!thumbnailFile}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Kapak dosyası (JPEG / PNG / WebP)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={thumbnailUrlField.trim().length > 0}
                onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm"
              />
            </div>
            {(thumbObjectUrl || (thumbnailUrlField.trim().startsWith("http") && thumbnailUrlField.trim().length > 12)) && (
              <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border border-slate-200 bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbObjectUrl || thumbnailUrlField.trim()}
                  alt="Kapak önizleme"
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={upload}
          disabled={uploading}
          className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Yükle
        </button>
      </div>
    </div>
  );
}

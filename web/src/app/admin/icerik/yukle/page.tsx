"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type TeacherCurriculumTopicRow, type TeacherCurriculumUploadResponse } from "@/lib/api";
import {
  ArrowLeft,
  Upload,
  Video,
  FileText,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  GraduationCap,
  Target,
  BookMarked,
  Layers,
} from "lucide-react";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function formatGradeLabel(g?: string | null): string {
  if (g == null || g === "" || g === "all") return "Tüm sınıflar";
  return `${g}. sınıf`;
}

const PURPOSE_OPTIONS = [
  {
    id: "curriculum",
    label: "Müfredat ders anlatımı",
    hint: "Sınıf içi konu anlatımı, temel kaynak",
  },
  {
    id: "exam_prep",
    label: "Sınav hazırlığı",
    hint: "TYT, AYT, LGS, KPSS vb. sınav odaklı içerik",
  },
  {
    id: "mock_before",
    label: "Deneme öncesi tekrar / özet",
    hint: "Deneme haftası veya branş denemesi öncesi",
  },
  {
    id: "extra",
    label: "Ek kaynak / pekiştirme",
    hint: "Opsiyonel video-PDF, derinleşme",
  },
] as const;

type PurposeId = (typeof PURPOSE_OPTIONS)[number]["id"];

const GRADE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Fark etmez (sınıfa göre filtreleme yok)" },
  { value: "5", label: "5. sınıf" },
  { value: "6", label: "6. sınıf" },
  { value: "7", label: "7. sınıf" },
  { value: "8", label: "8. sınıf" },
  { value: "9", label: "9. sınıf" },
  { value: "10", label: "10. sınıf" },
  { value: "11", label: "11. sınıf" },
  { value: "12", label: "12. sınıf" },
];

const EXAM_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Fark etmez (sınav türüne göre filtreleme yok)" },
  { value: "LGS", label: "LGS" },
  { value: "TYT", label: "TYT" },
  { value: "AYT", label: "AYT" },
  { value: "TYT-AYT", label: "TYT + AYT" },
  { value: "KPSS", label: "KPSS" },
  { value: "Genel", label: "Genel / okul içi" },
];

function formatLinkedCourseLine(lc: NonNullable<TeacherCurriculumUploadResponse["linked_course"]>): string {
  const g =
    lc.grade != null && String(lc.grade).trim() !== "" && String(lc.grade) !== "all"
      ? `${String(lc.grade).replace(/\.0$/, "")}. sınıf`
      : "Sınıf: tümü";
  const ex = lc.exam_type && String(lc.exam_type).trim() !== "" ? lc.exam_type : "—";
  const sub = lc.subject && String(lc.subject).trim() !== "" ? lc.subject : "—";
  return `${g} · ${ex} · ${sub}`;
}

function buildAdminDescription(params: {
  purposeLabel: string;
  audienceGrade: string;
  audienceExam: string;
  notes: string;
  topic: TeacherCurriculumTopicRow;
}): string {
  const lines: string[] = [];
  lines.push(`[Yönetim] Kullanım amacı: ${params.purposeLabel}`);
  lines.push(
    `Yönetici hedefi — Sınıf: ${params.audienceGrade || "Belirtilmedi"} · Sınav: ${params.audienceExam || "Belirtilmedi"}`,
  );
  lines.push(
    `Müfredat konusu: ${params.topic.title} (${params.topic.meb_code ?? "—"}) · Ders: ${params.topic.subject_name ?? "—"} · Ünite: ${params.topic.unit_title ?? "—"} · Konunun sınıfı: ${formatGradeLabel(params.topic.grade)} · Konunun sınavı: ${params.topic.exam_type ?? "—"}`,
  );
  if (params.notes.trim()) {
    lines.push(`Ek not: ${params.notes.trim()}`);
  }
  return lines.join("\n");
}

export default function AdminIcerikYuklePage() {
  const { token } = useAuth();

  const [gradeFilter, setGradeFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);
  const [subjectContains, setSubjectContains] = useState("");

  const [results, setResults] = useState<TeacherCurriculumTopicRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TeacherCurriculumTopicRow | null>(null);

  const [purpose, setPurpose] = useState<PurposeId>("curriculum");
  const [title, setTitle] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isFree, setIsFree] = useState(true);

  const [contentType, setContentType] = useState<"video" | "pdf">("video");
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbObjectUrl, setThumbObjectUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [lastUploadResult, setLastUploadResult] = useState<TeacherCurriculumUploadResponse | null>(null);

  const canQueryTopics =
    debouncedQ.trim().length >= 2 || gradeFilter !== "" || examFilter !== "";

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(thumbnailFile);
    setThumbObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [thumbnailFile]);

  useEffect(() => {
    setSelected(null);
  }, [gradeFilter, examFilter]);

  const search = useCallback(async () => {
    if (!token || !canQueryTopics) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const topics = await api.searchCurriculumTopics(debouncedQ.trim(), {
        limit: 50,
        grade: gradeFilter || undefined,
        exam_type: examFilter || undefined,
      });
      setResults(topics);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [token, debouncedQ, gradeFilter, examFilter, canQueryTopics]);

  useEffect(() => {
    search();
  }, [search]);

  const filteredResults = useMemo(() => {
    const s = subjectContains.trim().toLowerCase();
    if (!s) return results;
    return results.filter((t) => (t.subject_name || "").toLowerCase().includes(s));
  }, [results, subjectContains]);

  const purposeLabel = PURPOSE_OPTIONS.find((p) => p.id === purpose)?.label ?? purpose;
  const audienceGradeLabel = GRADE_OPTIONS.find((o) => o.value === gradeFilter)?.label ?? gradeFilter;
  const audienceExamLabel = EXAM_OPTIONS.find((o) => o.value === examFilter)?.label ?? examFilter;

  const upload = async () => {
    if (!token || !selected) {
      setMsg({ type: "err", text: "Önce müfredattan bir konu seçin." });
      return;
    }
    if (!file) {
      setMsg({ type: "err", text: "Dosyayı bilgisayarınızdan seçin (harici link kullanılmaz)." });
      return;
    }
    setUploading(true);
    setMsg(null);
    try {
      const description = buildAdminDescription({
        purposeLabel,
        audienceGrade: audienceGradeLabel,
        audienceExam: audienceExamLabel,
        notes: adminNotes,
        topic: selected,
      });
      const fd = new FormData();
      fd.append("curriculum_topic_id", String(selected.id));
      fd.append("content_type", contentType);
      if (title.trim()) fd.append("title", title.trim());
      fd.append("description", description);
      fd.append("is_free", isFree ? "1" : "0");
      fd.append("file", file);
      if (contentType === "video" && thumbnailFile) {
        fd.append("thumbnail", thumbnailFile);
      }
      const res = await api.uploadCurriculumContent(fd);
      setLastUploadResult(res);
      setMsg({
        type: "ok",
        text: "İçerik yüklendi. Aşağıda kapak ve kurs (sınıf/sınav) özeti görünür; öğrenci tarafı doğrulaması için notları okuyun.",
      });
      setFile(null);
      setThumbnailFile(null);
      setTitle("");
      setAdminNotes("");
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Yükleme başarısız" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-none px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-10 overflow-x-hidden">
      <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/icerik-merkezi"
          className="inline-flex w-fit items-center gap-2 text-slate-600 hover:text-teal-600 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          İçerik merkezine dön
        </Link>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Admin · Medya yükleme</span>
      </div>

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Müfredat medyası yükle</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 leading-relaxed">
            Önce <strong>hangi sınıf ve sınav profili</strong> için materyal yüklediğinizi seçin; konu listesi buna göre daralır. Ardından konuyu bulun,{" "}
            <strong>kullanım amacını</strong> (ders anlatımı, sınav hazırlığı, deneme öncesi vb.) işaretleyin ve dosyayı yükleyin. Bu bilgiler içerik kaydına
            not olarak eklenir.
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm font-medium ${
            msg.type === "ok" ? "border-teal-100 bg-teal-50 text-teal-900" : "border-red-100 bg-red-50 text-red-800"
          } flex items-start gap-2`}
        >
          {msg.type === "ok" ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      {lastUploadResult?.content_item && (
        <div className="mb-8 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/90 to-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-800">Son yüklenen içerik</p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 sm:w-56">
              {lastUploadResult.content_item.thumbnail_url ? (
                <Image
                  src={lastUploadResult.content_item.thumbnail_url}
                  alt="Kapak"
                  fill
                  className="object-cover"
                  sizes="224px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-slate-400">Kapak yok</div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <p className="font-semibold text-slate-900">{lastUploadResult.content_item.title}</p>
              <p className="text-slate-600">
                <span className="font-medium text-slate-700">Müfredat konusu:</span>{" "}
                {lastUploadResult.curriculum_topic_title ?? "—"}{" "}
                {lastUploadResult.curriculum_topic_id != null ? `(ID: ${lastUploadResult.curriculum_topic_id})` : ""}
              </p>
              {lastUploadResult.linked_course ? (
                <p className="rounded-lg bg-white/80 px-3 py-2 text-slate-800 ring-1 ring-slate-200">
                  <span className="font-medium text-teal-900">Öğrenci kurs kaydı (bağlantı):</span>{" "}
                  {formatLinkedCourseLine(lastUploadResult.linked_course)}
                  <span className="mt-1 block text-xs font-normal text-slate-600">{lastUploadResult.linked_course.title}</span>
                </p>
              ) : null}
              <p className="text-xs leading-relaxed text-slate-600">
                <strong>Derslerim:</strong> Öğrenci ilgili dersi açınca ünite ve konu seçtiğinde bu video/PDF, konunun içerik listesinde görünür (sunucu aynı müfredat konusuna bağlı{" "}
                <code className="rounded bg-slate-100 px-1 text-[11px]">linked_topic</code> kaydı üzerinden okur).
              </p>
              <p className="text-xs leading-relaxed text-slate-600">
                <strong>Video &amp; PDF sayfası:</strong> Öğrenci panelindeki &quot;Video &amp; PDF&quot; ekranı da aynı kayıtları{" "}
                <code className="rounded bg-slate-100 px-1 text-[11px]">/curriculum/media-catalog</code> ile toplar; yani buraya yüklenen her aktif video ve PDF, öğrencinin sınıf/sınav
                kapsamına uygunsa hem konu detayında hem bu merkezi listede yer alır (PDF sayfa görselleri işlendikten sonra listede de güncellenir).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/admin/icerik"
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Yüklenen içerikler listesi
                </Link>
                <button
                  type="button"
                  onClick={() => setLastUploadResult(null)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Önizlemeyi kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Sol sütun: hedef + konu */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">1. Hedef kitle</h2>
                <p className="text-xs text-slate-500">Konu aramasını bu sınıf ve sınav türüne göre sınırlar.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Sınıf</label>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/0 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                >
                  {GRADE_OPTIONS.map((o) => (
                    <option key={o.value || "any"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">Sınav / program</label>
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500/0 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                >
                  {EXAM_OPTIONS.map((o) => (
                    <option key={o.value || "any-ex"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              İpucu: &quot;Fark etmez&quot; seçiliyse yalnızca aşağıdaki arama kutusu (en az 2 karakter) ile konu bulunur. Sınıf veya sınav seçtiyseniz arama
              kutusu boşken de liste getirilebilir.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">2. Müfredat konusu</h2>
                <p className="text-xs text-slate-500">Konu başlığı veya MEB kodu ile arayın; isteğe bağlı ders adı süzgeci uygulanır.</p>
              </div>
            </div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Konu ara (en az 2 karakter — veya üstte sınıf/sınav seçiliyse boş bırakılabilir)</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
              placeholder="Örn: logaritma, parabol, M.10.1.1…"
            />
            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Ders adında geçsin (isteğe bağlı, istemci süzgeci)</label>
              <input
                value={subjectContains}
                onChange={(e) => setSubjectContains(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
                placeholder="Örn: Matematik"
              />
            </div>
            {searching && <p className="mt-2 text-xs text-slate-400">Aranıyor…</p>}
            {!canQueryTopics && (
              <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Konu listesi için: en az 2 karakter yazın <strong>veya</strong> üstte sınıf / sınav seçin.
              </p>
            )}
            {canQueryTopics && filteredResults.length > 0 && (
              <ul className="mt-3 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100 sm:max-h-72">
                {filteredResults.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(t)}
                      className={`w-full px-3 py-3 text-left text-sm transition-colors hover:bg-teal-50/70 ${
                        selected?.id === t.id ? "bg-teal-50 font-semibold text-teal-950" : "text-slate-800"
                      }`}
                    >
                      <span className="block">{t.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">{t.subject_name ?? "—"}</span>
                        <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-violet-800">{formatGradeLabel(t.grade)}</span>
                        <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-sky-900">{t.exam_type ?? "—"}</span>
                        <span>{t.unit_title ?? ""}</span>
                        <span className="text-slate-400">{t.meb_code || ""}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {canQueryTopics && !searching && filteredResults.length === 0 && (
              <p className="mt-3 text-sm text-slate-500">Sonuç yok. Filtreleri veya arama metnini değiştirin.</p>
            )}

            {selected && (
              <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-teal-900">Seçilen konu</p>
                <p className="mt-1 font-semibold text-slate-900">{selected.title}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-white/90 px-2 py-1 font-medium text-slate-800 ring-1 ring-slate-200">{selected.subject_name ?? "—"}</span>
                  <span className="rounded-lg bg-white/90 px-2 py-1 text-slate-700 ring-1 ring-slate-200">{formatGradeLabel(selected.grade)}</span>
                  <span className="rounded-lg bg-white/90 px-2 py-1 text-slate-700 ring-1 ring-slate-200">{selected.exam_type ?? "—"}</span>
                  <span className="rounded-lg bg-white/90 px-2 py-1 text-slate-600 ring-1 ring-slate-200">{selected.meb_code || "MEB kodu yok"}</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sağ sütun: kullanım + dosya */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">3. Kullanım ve erişim</h2>
                <p className="text-xs text-slate-500">İçeriğin neden yüklendiğini ve kimin göreceğini belirtin.</p>
              </div>
            </div>
            <fieldset className="space-y-2">
              <legend className="sr-only">Kullanım amacı</legend>
              {PURPOSE_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                    purpose === opt.id ? "border-violet-400 bg-violet-50/80" : "border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="purpose"
                    checked={purpose === opt.id}
                    onChange={() => setPurpose(opt.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
              <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="rounded border-slate-300" />
              Ücretsiz erişim (işaret kaldırılırsa ücretli paketlere özel akışlara uygun kayıt için işaretlenir)
            </label>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Liste başlığı (opsiyonel)</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
                placeholder="Boş bırakılırsa konu adı + Video/PDF kullanılır"
              />
            </div>
            <div className="mt-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
                <BookMarked className="h-3.5 w-3.5" />
                Yönetici notu (opsiyonel)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/15"
                placeholder="Örn: 2026 TYT kampı 2. hafta, şu deneme öncesi tekrar videosu…"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">4. Dosya</h2>
                <p className="text-xs text-slate-500">Video veya PDF yalnızca dosya olarak yüklenir.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setContentType("video");
                  setThumbnailFile(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
                  contentType === "video" ? "border-teal-500 bg-teal-50 text-teal-900" : "border-slate-200 text-slate-700"
                }`}
              >
                <Video className="h-4 w-4" /> Video
              </button>
              <button
                type="button"
                onClick={() => {
                  setContentType("pdf");
                  setThumbnailFile(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${
                  contentType === "pdf" ? "border-amber-500 bg-amber-50 text-amber-950" : "border-slate-200 text-slate-700"
                }`}
              >
                <FileText className="h-4 w-4" /> PDF
              </button>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Dosya (zorunlu)</label>
              <input
                type="file"
                accept={contentType === "video" ? "video/*" : "application/pdf"}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200"
              />
            </div>
            {contentType === "video" && (
              <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <ImageIcon className="h-3.5 w-3.5" /> Özel kapak (opsiyonel)
                </p>
                <p className="text-[11px] text-slate-500">Boş bırakılırsa sunucu otomatik kapak üretir.</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                {thumbObjectUrl && (
                  <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbObjectUrl} alt="Önizleme" className="h-full w-full object-cover object-center" loading="lazy" />
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={upload}
              disabled={uploading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Yükle
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

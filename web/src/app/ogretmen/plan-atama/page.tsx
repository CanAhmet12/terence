"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { teacherApi, ClassRoom, User } from "@/lib/api";
import { TEACHER_PLAN_TEMPLATE_PACKS } from "@/lib/plan-teacher-template-packs";
import type { PlanTemplatePack } from "@/lib/api";
import {
  AlertCircle,
  Calendar,
  Loader2,
  Plus,
  Send,
  Trash2,
  Users,
  ChevronLeft,
} from "lucide-react";

type TaskRow = {
  id: string;
  title: string;
  type: string;
  subject: string;
  planned_minutes: number;
  priority: string;
};

function newRow(): TaskRow {
  return {
    id: crypto.randomUUID(),
    title: "",
    type: "custom",
    subject: "",
    planned_minutes: 30,
    priority: "normal",
  };
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function OgretmenPlanAtamaPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const classFromQuery = searchParams.get("class_id");

  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [classId, setClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [planDate, setPlanDate] = useState(todayInputValue);
  const [rows, setRows] = useState<TaskRow[]>([newRow()]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const list = await teacherApi.getTeacherClasses(token);
      setClasses(list);
      const qid = classFromQuery ? parseInt(classFromQuery, 10) : NaN;
      if (Number.isFinite(qid) && list.some((c: ClassRoom) => c.id === qid)) {
        setClassId(qid);
      } else if (list.length > 0) {
        setClassId((prev) => prev ?? list[0].id);
      }
    } catch (e) {
      setError((e as Error).message || "Sınıflar yüklenemedi");
    }
    setLoading(false);
  }, [token, classFromQuery]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      return;
    }
    setStudentsLoading(true);
    teacherApi
      .getClassStudents(classId)
      .then((raw: User[]) => setStudents(Array.isArray(raw) ? raw : []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [classId]);

  const allSelected = useMemo(() => {
    if (students.length === 0) return false;
    return students.every((s) => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAllStudents = () => {
    if (allSelected) setSelectedStudentIds([]);
    else setSelectedStudentIds(students.map((s) => s.id));
  };

  const applyTemplate = (pack: PlanTemplatePack) => {
    setRows(
      pack.tasks.map((t) => ({
        id: crypto.randomUUID(),
        title: t.title,
        type: t.type ?? "custom",
        subject: t.subject ?? "",
        planned_minutes: t.planned_minutes ?? 30,
        priority: t.priority ?? "normal",
      })),
    );
    setMessage(
      `“${pack.label}” şablonu yüklendi. Göndermeden önce düzenleyebilirsiniz.`,
    );
  };

  const handleSubmit = async () => {
    if (!classId) return;
    const tasks = rows
      .filter((r) => r.title.trim())
      .map((r) => ({
        title: r.title.trim(),
        type: r.type as
          | "video"
          | "question"
          | "exam"
          | "read"
          | "repeat"
          | "custom",
        subject: r.subject.trim() || undefined,
        planned_minutes: r.planned_minutes,
        priority: r.priority as "low" | "normal" | "high",
      }));
    if (tasks.length === 0) {
      setError("En az bir görev başlığı girin.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const client_batch_id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : undefined;
      const res = await teacherApi.assignClassPlanTasks(classId, {
        plan_date: planDate,
        tasks,
        student_ids:
          selectedStudentIds.length > 0 ? selectedStudentIds : undefined,
        client_batch_id,
      });
      setMessage(
        `Gönderildi: ${res.students_affected} öğrenci, ${res.tasks_created} görev kaydı.`,
      );
    } catch (e) {
      setError((e as Error).message || "Atama başarısız");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="w-full space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/ogretmen/siniflar"
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Sınıflarım
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Günlük plan gönder
            </h1>
            <p className="mt-1 font-medium text-slate-500">
              Seçili güne görev paketi — tüm sınıf veya işaretli öğrenciler.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {message}
          </div>
        )}

        {loading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Hedef
              </h2>
              <label className="block text-xs font-semibold text-slate-600">
                Sınıf
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                  value={classId ?? ""}
                  onChange={(e) =>
                    setClassId(
                      e.target.value ? parseInt(e.target.value, 10) : null,
                    )
                  }
                >
                  <option value="">Seçin</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Plan tarihi
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-500"
                    value={planDate}
                    onChange={(e) => setPlanDate(e.target.value)}
                  />
                </div>
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    Öğrenciler (boş = tümü)
                  </span>
                  {students.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllStudents}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                    >
                      {allSelected ? "Temizle" : "Tümünü seç"}
                    </button>
                  )}
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-2">
                  {studentsLoading ? (
                    <p className="p-4 text-center text-sm text-slate-400">
                      Yükleniyor…
                    </p>
                  ) : students.length === 0 ? (
                    <p className="p-4 text-center text-sm text-slate-400">
                      Bu sınıfta öğrenci yok
                    </p>
                  ) : (
                    students.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-white"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => toggleStudent(s.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {s.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Şablon
              </h2>
              <div className="flex flex-wrap gap-2">
                {TEACHER_PLAN_TEMPLATE_PACKS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyTemplate(p)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <h2 className="pt-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                Görevler
              </h2>
              <div className="space-y-3">
                {rows.map((r, i) => (
                  <div
                    key={r.id}
                    className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-12"
                  >
                    <input
                      className="sm:col-span-5 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Başlık"
                      value={r.title}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, title: v } : x,
                          ),
                        );
                      }}
                    />
                    <select
                      className="sm:col-span-2 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                      value={r.type}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, type: v } : x,
                          ),
                        );
                      }}
                    >
                      <option value="custom">Özel</option>
                      <option value="question">Soru</option>
                      <option value="video">Video</option>
                      <option value="exam">Deneme</option>
                      <option value="read">Okuma</option>
                      <option value="repeat">Tekrar</option>
                    </select>
                    <input
                      className="sm:col-span-2 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                      placeholder="Ders"
                      value={r.subject}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, subject: v } : x,
                          ),
                        );
                      }}
                    />
                    <input
                      type="number"
                      min={5}
                      className="sm:col-span-1 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                      title="Dakika"
                      value={r.planned_minutes}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 0;
                        setRows((prev) =>
                          prev.map((x, j) =>
                            j === i ? { ...x, planned_minutes: v } : x,
                          ),
                        );
                      }}
                    />
                    <div className="flex items-center justify-end gap-1 sm:col-span-2">
                      <button
                        type="button"
                        onClick={() =>
                          setRows((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Satırı sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRows((prev) => [...prev, newRow()])}
                className="flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900"
              >
                <Plus className="h-4 w-4" />
                Satır ekle
              </button>

              <button
                type="button"
                disabled={submitting || !classId}
                onClick={() => void handleSubmit()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3.5 text-sm font-bold text-white shadow-md hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Plana gönder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

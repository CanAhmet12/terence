"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CheckCircle, ChevronRight, GraduationCap, Target, Sparkles } from "lucide-react";

// ─── Konfigürasyonlar ─────────────────────────────────────────────────────────

const GRADES = [
  { value: "5",  label: "5. Sınıf",  sub: "İlkokul",    emoji: "🏫", color: "#10b981" },
  { value: "6",  label: "6. Sınıf",  sub: "Ortaokul",   emoji: "📚", color: "#3b82f6" },
  { value: "7",  label: "7. Sınıf",  sub: "Ortaokul",   emoji: "📚", color: "#6366f1" },
  { value: "8",  label: "8. Sınıf",  sub: "LGS Hazırlık",emoji: "🎯", color: "#f59e0b" },
  { value: "9",  label: "9. Sınıf",  sub: "Lise",       emoji: "🎓", color: "#ef4444" },
  { value: "10", label: "10. Sınıf", sub: "Lise",       emoji: "🎓", color: "#8b5cf6" },
  { value: "11", label: "11. Sınıf", sub: "Lise",       emoji: "🎓", color: "#0ea5e9" },
  { value: "12", label: "12. Sınıf", sub: "YKS Hazırlık",emoji: "🏆", color: "#f97316" },
];

const EXAM_TYPES: Record<string, Array<{ value: string; label: string; sub: string; icon: string; color: string }>> = {
  "8": [
    { value: "LGS", label: "LGS", sub: "Liselere Giriş Sınavı", icon: "📝", color: "#10b981" },
  ],
  "9":  [
    { value: "TYT",     label: "TYT",      sub: "Temel Yeterlilik (Tüm alanlar)",  icon: "📐", color: "#1565c0" },
    { value: "TYT-AYT", label: "TYT + AYT", sub: "Sayısal, Sözel veya EA hedefli", icon: "🎯", color: "#6a1b9a" },
  ],
  "10": [
    { value: "TYT",     label: "TYT",      sub: "Temel Yeterlilik",               icon: "📐", color: "#1565c0" },
    { value: "TYT-AYT", label: "TYT + AYT", sub: "Sayısal, Sözel veya EA hedefli", icon: "🎯", color: "#6a1b9a" },
  ],
  "11": [
    { value: "TYT",     label: "TYT",      sub: "Temel Yeterlilik",               icon: "📐", color: "#1565c0" },
    { value: "AYT",     label: "AYT",      sub: "Alan Yeterlilik",                icon: "🧪", color: "#e65100" },
    { value: "TYT-AYT", label: "TYT + AYT", sub: "Sayısal, Sözel veya EA hedefli", icon: "🎯", color: "#6a1b9a" },
  ],
  "12": [
    { value: "TYT",     label: "TYT",      sub: "Temel Yeterlilik",               icon: "📐", color: "#1565c0" },
    { value: "AYT",     label: "AYT",      sub: "Alan Yeterlilik",                icon: "🧪", color: "#e65100" },
    { value: "TYT-AYT", label: "TYT + AYT", sub: "En kapsamlı hazırlık",          icon: "🏆", color: "#6a1b9a" },
  ],
  "default": [
    { value: "Genel",   label: "Genel",    sub: "Müfredat odaklı",                icon: "📚", color: "#64748b" },
    { value: "KPSS",    label: "KPSS",     sub: "Kamu Personeli Seçme Sınavı",   icon: "🎓", color: "#4527a0" },
  ],
};

function getExamOptions(grade: string) {
  return EXAM_TYPES[grade] ?? EXAM_TYPES["default"];
}

// ─── Bileşenler ───────────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
          i < step ? "bg-indigo-600 w-8" : i === step ? "bg-indigo-400 w-6" : "bg-slate-200 w-4"
        }`} />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState(0); // 0: sınıf, 1: sınav tipi, 2: tamamlandı
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleGradeSelect = (grade: string) => {
    setSelectedGrade(grade);
    setSelectedExam(""); // önceki seçimi temizle
  };

  const handleNextStep = () => {
    if (step === 0 && selectedGrade) {
      setStep(1);
    }
  };

  const handleFinish = async () => {
    if (!selectedGrade || !selectedExam) return;
    setSaving(true);
    setError("");
    try {
      // Backend grade'i 1-12 arası integer bekliyor, mezun için null
      const gradeValue = selectedGrade === "mezun" ? null : parseInt(selectedGrade, 10);

      await api.updateProfile({
        grade: gradeValue as unknown as number,
        target_exam: selectedExam,
      } as Parameters<typeof api.updateProfile>[0]);

      // Kullanıcı objesini API'den güncel haliyle al
      const me = await api.getMe();
      updateUser(me);

      setStep(2);
      setTimeout(() => {
        router.push("/ogrenci/dersler");
      }, 1800);
    } catch (e) {
      const msg = (e as Error).message || "";
      if (msg.includes("422") || msg.includes("validation")) {
        setError("Bilgiler kaydedilemedi. Lütfen seçimlerinizi kontrol edin.");
      } else {
        setError(msg || "Bir hata oluştu, tekrar deneyin.");
      }
    }
    setSaving(false);
  };

  const examOptions = getExamOptions(selectedGrade);

  // ─── Tamamlandı ekranı ────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Harika! Hazırsın 🎉</h2>
          <p className="text-slate-600">Müfredatın kişiselleştirildi. Derslerine yönlendiriliyorsun...</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Üst başlık */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {user?.name ? `Hoş geldin, ${user.name.split(" ")[0]}!` : "Hoş geldin!"}
          </h1>
          <p className="text-slate-500 mt-2">
            Sana özel müfredat hazırlayabilmem için birkaç soruyu cevaplamanı istiyorum.
          </p>
          <div className="mt-4 flex justify-center">
            <StepIndicator step={step} total={2} />
          </div>
        </div>

        {/* Adım 1: Sınıf Seçimi */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Adım 1 / 2</p>
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                Hangi sınıftasın?
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GRADES.map((g) => (
                <button
                  key={g.value}
                  onClick={() => handleGradeSelect(g.value)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                    selectedGrade === g.value
                      ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {selectedGrade === g.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="text-2xl mb-2">{g.emoji}</div>
                  <div className="font-bold text-slate-900 text-sm">{g.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{g.sub}</div>
                </button>
              ))}
            </div>

            {/* KPSS seçeneği */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-xs text-slate-500 text-center mb-3">Lise mezunu musun?</p>
              <button
                onClick={() => handleGradeSelect("mezun")}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                  selectedGrade === "mezun"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span className="text-2xl">🎓</span>
                <div>
                  <div className="font-bold text-slate-900">Mezun / KPSS Adayı</div>
                  <div className="text-xs text-slate-500">Üniversite veya KPSS hazırlığı</div>
                </div>
                {selectedGrade === "mezun" && (
                  <CheckCircle className="w-5 h-5 text-indigo-500 ml-auto" />
                )}
              </button>
            </div>

            <button
              onClick={handleNextStep}
              disabled={!selectedGrade}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
            >
              Devam Et
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Adım 2: Sınav Tipi */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Adım 2 / 2</p>
              <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                Hedef sınavın hangisi?
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Seçimine göre ilgili konular ve müfredat önüne gelecek.
              </p>
            </div>

            <div className="space-y-3">
              {examOptions.map((exam) => (
                <button
                  key={exam.value}
                  onClick={() => setSelectedExam(exam.value)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-200 flex items-center gap-4 hover:shadow-md ${
                    selectedExam === exam.value
                      ? "border-violet-500 bg-violet-50 shadow-md shadow-violet-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${exam.color}18`, border: `2px solid ${exam.color}40` }}
                  >
                    {exam.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-base">{exam.label}</div>
                    <div className="text-sm text-slate-500">{exam.sub}</div>
                  </div>
                  {selectedExam === exam.value && (
                    <CheckCircle className="w-6 h-6 text-violet-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
              >
                Geri
              </button>
              <button
                onClick={handleFinish}
                disabled={!selectedExam || saving}
                className="flex-2 flex-grow-[2] py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
              >
                {saving ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Müfredatımı Hazırla</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Alt not */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Bu seçimini daha sonra Profil &gt; Hedef sayfasından değiştirebilirsin.
        </p>
      </div>
    </div>
  );
}

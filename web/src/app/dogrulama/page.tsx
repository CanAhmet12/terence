"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const CODE_LENGTH = 6;
const RESEND_TIMEOUT = 60;

function DogrulamaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.replace("/giris");
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInput = useCallback(
    (index: number, value: string) => {
      const char = value.replace(/\D/g, "").slice(-1);
      const next = [...code];
      next[index] = char;
      setCode(next);
      setError("");

      if (char && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Tüm haneler dolunca otomatik doğrula
      if (char && next.every((c) => c !== "")) {
        verifyCode(next.join(""));
      }
    },
    [code] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      if (i < CODE_LENGTH) next[i] = char;
    });
    setCode(next);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === CODE_LENGTH) {
      verifyCode(pasted);
    }
  };

  const verifyCode = async (codeStr: string) => {
    if (codeStr.length !== CODE_LENGTH) return;
    setLoading(true);
    setError("");
    try {
      await api.verifyEmail({ email, verification_code: codeStr });
      setSuccess(true);
      setTimeout(() => router.push("/giris?verified=1"), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Doğrulama başarısız";
      setError(
        msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")
          ? "Kod hatalı veya süresi dolmuş. Lütfen tekrar deneyin."
          : msg
      );
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError("");
    try {
      await api.resendVerification(email);
      setCountdown(RESEND_TIMEOUT);
      setCanResend(false);
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Kod gönderilemedi";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(code.join(""));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-teal-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">E-posta Doğrulandı!</h1>
          <p className="text-slate-600 mb-6">Hesabın başarıyla aktifleştirildi. Giriş sayfasına yönlendiriliyorsun...</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md">
        <Link href="/giris" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Giriş sayfasına dön
        </Link>

        <Link href="/" className="inline-flex items-center gap-3 text-slate-900 mb-8 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <GraduationCap className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-xl tracking-tight">
            TERENCE <span className="text-teal-600">EĞİTİM</span>
          </span>
        </Link>

        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-5">
            <Mail className="w-7 h-7 text-teal-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">E-postanı Doğrula</h1>
          <p className="text-slate-600 leading-relaxed">
            <span className="font-semibold text-slate-800">{email}</span> adresine{" "}
            {CODE_LENGTH} haneli doğrulama kodu gönderdik.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4">Doğrulama Kodu</label>
            <div className="flex gap-3" onPaste={handlePaste}>
              {Array(CODE_LENGTH)
                .fill(null)
                .map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i]}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={loading}
                    className={`w-full aspect-square text-center text-2xl font-bold border-2 rounded-2xl outline-none transition-all disabled:opacity-50 ${
                      code[i]
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-slate-200 bg-slate-50 text-slate-900 focus:border-teal-400 focus:bg-white"
                    }`}
                  />
                ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.some((c) => !c)}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-teal-500/25"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Doğrulanıyor...
              </span>
            ) : (
              "Hesabımı Doğrula"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500 mb-3">Kodu almadın mı?</p>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
              {resending ? "Gönderiliyor..." : "Tekrar Kod Gönder"}
            </button>
          ) : (
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{countdown}</span> saniye sonra tekrar gönderebilirsin
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DogrulamaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <DogrulamaContent />
    </Suspense>
  );
}

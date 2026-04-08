"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Bot, Send, RefreshCw, Sparkles, BookOpen, Target,
  TrendingUp, Calendar, ChevronRight, Mic, MicOff,
  Volume2, User, Plus, Trash2, Clock, X
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

// Hızlı başlangıç önerileri
const QUICK_SUGGESTIONS = [
  { icon: Target,      label: "Hedef Analizi",         prompt: "Sınav hedefime ne kadar yakınım? Net analizimi yapar mısın?" },
  { icon: BookOpen,    label: "Zayıf Konularım",        prompt: "En zayıf olduğum konular hangileri ve nasıl geliştirebilirim?" },
  { icon: Calendar,    label: "Bugünkü Plan",           prompt: "Bugün için bana özel çalışma planı öner." },
  { icon: TrendingUp,  label: "İlerleme Değerlendirmesi",prompt: "Son haftalık ilerlememimi değerlendirir misin?" },
  { icon: Sparkles,    label: "Motivasyon",             prompt: "Biraz motivasyona ihtiyacım var, beni motive et." },
  { icon: BookOpen,    label: "Soru Çözüm Tekniği",    prompt: "Sınavda daha hızlı ve doğru soru çözmek için ipuçları ver." },
];

// Yazıyor animasyonu
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 max-w-[75%]">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

// Mesaj balonu
function MessageBubble({ msg, userInitials }: { msg: Message; userInitials: string }) {
  const isUser = msg.role === "user";
  const time = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
        isUser
          ? "bg-indigo-600 text-white text-xs font-bold"
          : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
      }`}>
        {isUser ? userInitials : <Bot className="w-4 h-4" />}
      </div>

      {/* Balon */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"
        }`}>
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? "text-white" : "text-slate-800"}`}>
            {msg.content}
          </p>
        </div>
        {time && (
          <p className={`text-[10px] font-medium ${isUser ? "text-right text-slate-400" : "text-slate-400"}`}>
            {time}
          </p>
        )}
      </div>
    </div>
  );
}

export default function KocPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userInitials = (user?.name ?? "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Geçmiş yükle
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.getCoachHistory();
        const histArr = Array.isArray(res) ? res : ((res as Record<string, unknown>).messages ?? []) as Message[];
        if (histArr.length > 0) {
          setMessages(histArr as Message[]);
          setShowSuggestions(false);
        } else {
          setMessages([{
            role: "assistant",
            content: `Merhaba ${user?.name?.split(" ")[0] ?? ""}! 👋 Ben senin dijital koç asistanın.\n\nSınav hazırlık sürecinde sana rehberlik etmek için buradayım. Net analizi, çalışma planı, zayıf konu tespiti ve motivasyon konularında yardımcı olabilirim.\n\nNe hakkında konuşmak istersin?`,
            created_at: new Date().toISOString(),
          }]);
        }
      } catch {
        setMessages([{
          role: "assistant",
          content: `Merhaba ${user?.name?.split(" ")[0] ?? ""}! 👋 Ben senin dijital koç asistanın. Sana yardımcı olmaya hazırım. Bir konu seç veya sorunuzu yazın!`,
          created_at: new Date().toISOString(),
        }]);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [user?.name]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;
    setError(null);
    setShowSuggestions(false);
    setSuggestions([]);

    const userMsg: Message = { role: "user", content: text.trim(), created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    const histForApi = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await api.askCoach(text.trim(), histForApi);
      const assistantMsg: Message = {
        role: "assistant",
        content: res.reply || "Üzgünüm, şu an yanıt veremiyorum.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Önerilen takip soruları
      if (res.suggestions && Array.isArray(res.suggestions) && res.suggestions.length > 0) {
        setSuggestions(res.suggestions.slice(0, 3));
      }
    } catch (e) {
      setError((e as Error).message || "Mesaj gönderilemedi");
      const fallback: Message = {
        role: "assistant",
        content: "Şu an servise ulaşamıyorum. Lütfen biraz sonra tekrar dene.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, sending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = async () => {
    if (!window.confirm("Konuşma geçmişini temizlemek istediğinizden emin misiniz?")) return;
    try {
      await api.clearCoachHistory();
    } catch {}
    setMessages([{
      role: "assistant",
      content: "Konuşma temizlendi! Yeni bir konudan başlayalım. Ne öğrenmek veya sormak istiyorsun? 🚀",
      created_at: new Date().toISOString(),
    }]);
    setShowSuggestions(true);
    setSuggestions([]);
  };

  // Input yüksekliği auto-grow
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden">

      {/* ── Ana chat alanı ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100 shrink-0 shadow-[0_1px_0_0_#f1f5f9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-none">Dijital Koç</h1>
              <p className="text-xs text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Çevrimiçi · AI Destekli
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Konuşmayı temizle"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temizle</span>
            </button>
          </div>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-sm text-slate-400">Geçmiş yükleniyor...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} userInitials={userInitials} />
            ))
          )}

          {/* Yazıyor */}
          {sending && <TypingIndicator />}

          {/* Hata */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-w-sm">
              <X className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Takip önerileri */}
          {suggestions.length > 0 && !sending && (
            <div className="flex flex-col gap-2 mt-2 max-w-lg">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider px-1">Devam et</p>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Hızlı başlangıç önerileri (ilk açılışta) */}
        {showSuggestions && !loadingHistory && messages.length <= 1 && (
          <div className="px-6 pb-4 shrink-0">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Hızlı Başlat</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  className="flex items-start gap-2.5 p-3.5 text-left bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-2xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                    <s.icon className="w-4 h-4 text-indigo-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-700 leading-tight">{s.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">{s.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Alanı */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 shrink-0">
          <div className="flex gap-3 items-end max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Koçuna bir şey sor... (Enter ile gönder)"
                rows={1}
                className="w-full resize-none rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none px-4 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all overflow-hidden"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-sm shadow-indigo-500/25 active:scale-95 shrink-0"
            >
              {sending ? (
                <RefreshCw className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5" />
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-300 mt-2">
            Enter ile gönder · Shift+Enter yeni satır
          </p>
        </div>
      </div>
    </div>
  );
}

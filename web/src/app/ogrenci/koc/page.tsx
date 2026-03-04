"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Bot,
  Send,
  RefreshCw,
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
  ChevronRight,
  AlertCircle,
  User,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

const QUICK_SUGGESTIONS = [
  { icon: Target, label: "Hedefe ne kadar yakınım?", prompt: "Sınav hedefime ne kadar yakınım? Net analizimi yapar mısın?" },
  { icon: BookOpen, label: "Zayıf konularım neler?", prompt: "En zayıf olduğum konular hangileri ve nasıl geliştirebilirim?" },
  { icon: Calendar, label: "Bugünkü planım", prompt: "Bugün için bana özel çalışma planı öner." },
  { icon: TrendingUp, label: "İlerleme değerlendirmesi", prompt: "Son haftalık ilerlememimi değerlendirir misin?" },
  { icon: Sparkles, label: "Motivasyon ver", prompt: "Biraz motivasyona ihtiyacım var, beni motive et." },
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser
          ? "bg-slate-200"
          : "bg-gradient-to-br from-teal-500 to-teal-600"
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-slate-600" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
        isUser
          ? "bg-teal-600 text-white rounded-br-sm"
          : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"
      }`}>
        {msg.content}
        {msg.created_at && (
          <p className={`text-xs mt-1.5 ${isUser ? "text-teal-200" : "text-slate-400"}`}>
            {new Date(msg.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
}

export default function KocPage() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!token) return;
    const loadHistory = async () => {
      try {
        const res = await api.getCoachHistory(token);
        if (res.messages && res.messages.length > 0) {
          setMessages(res.messages);
          setShowSuggestions(false);
        } else {
          setMessages([{
            role: "assistant",
            content: `Merhaba ${user?.name?.split(" ")[0] ?? ""}! 👋 Ben senin dijital koç asistanın.\n\nSınav hazırlık sürecinde sana rehberlik etmek için buradayım. Net analizi, çalışma planı, zayıf konu tespiti ve motivasyon konularında sana yardımcı olabilirim.\n\nNe hakkında konuşmak istersin?`,
            created_at: new Date().toISOString(),
          }]);
        }
      } catch {
        setMessages([{
          role: "assistant",
          content: `Merhaba ${user?.name?.split(" ")[0] ?? ""}! 👋 Ben senin dijital koç asistanın.\n\nSınav hazırlık sürecinde sana rehberlik etmek için buradayım. Başlamak için bir konu seç veya doğrudan sorunuzu yazın!`,
          created_at: new Date().toISOString(),
        }]);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [token, user?.name]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !token || sending) return;
    setError(null);
    setShowSuggestions(false);

    const userMsg: Message = { role: "user", content: text.trim(), created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    const historyForApi = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await api.askCoach(token, text.trim(), historyForApi);
      const assistantMsg: Message = {
        role: "assistant",
        content: res.reply || "Üzgünüm, şu an cevap veremiyorum.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.suggestions && res.suggestions.length > 0) {
        // Suggestions could be shown as quick replies
      }
    } catch (e) {
      setError((e as Error).message || "Mesaj gönderilemedi");
      const fallback: Message = {
        role: "assistant",
        content: "Şu an servise ulaşamıyorum. Lütfen biraz sonra tekrar dene.\n\nBu süreçte şunları yapabilirsin:\n• Zayıf kazanımlar sayfandan çalışma planı ekle\n• Hedef & Net sayfandan ilerlemeyi incele\n• Performans raporunu gözden geçir",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [token, sending, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    if (!window.confirm("Konuşma geçmişini temizlemek istediğine emin misin?")) return;
    setMessages([{
      role: "assistant",
      content: `Konuşma temizlendi. Yeni bir konudan başlayalım! Ne öğrenmek veya sormak istiyorsun?`,
      created_at: new Date().toISOString(),
    }]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dijital Koç</h1>
            <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block animate-pulse" />
              Çevrimiçi · AI Destekli
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          title="Konuşmayı temizle"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-8 mb-2 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto font-semibold hover:underline">Kapat</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-4">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-6 h-6 text-teal-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-400">Yükleniyor...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} msg={msg} />
            ))}
            {sending && <TypingIndicator />}

            {/* Hızlı Öneri Butonları */}
            {showSuggestions && !sending && messages.length <= 1 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-slate-400 font-medium pl-11">Hızlı başlangıç:</p>
                {QUICK_SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(prompt)}
                    className="ml-11 flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 transition-all shadow-sm group"
                  >
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-teal-500 shrink-0" />
                    <span>{label}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-teal-400" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-8 pb-8 shrink-0">
        <div className="flex items-end gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-400 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sorunuzu yazın... (Enter ile gönder, Shift+Enter yeni satır)"
            rows={1}
            className="flex-1 resize-none text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent max-h-32 overflow-y-auto"
            style={{ minHeight: "24px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 128) + "px";
            }}
            disabled={sending}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || sending}
            className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white disabled:text-slate-400" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          AI destekli koç asistanı · Kişisel verilerini paylaşma
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ForumPost, ForumReply } from "@/lib/api";
import {
  MessageSquare,
  ThumbsUp,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Eye,
  RefreshCw,
  X,
  ChevronLeft,
  Send,
  BookOpen,
  AlertCircle,
  Star,
} from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded-xl animate-pulse ${className ?? ""}`} />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Az önce";
  if (min < 60) return `${min}dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}s önce`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}g önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

const SUBJECTS = ["", "Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Tarih", "Coğrafya", "İngilizce", "Felsefe", "Diğer"];
const SUBJECT_COLORS: Record<string, string> = {
  Matematik: "bg-blue-100 text-blue-700",
  Fizik: "bg-purple-100 text-purple-700",
  Kimya: "bg-green-100 text-green-700",
  Biyoloji: "bg-emerald-100 text-emerald-700",
  Türkçe: "bg-orange-100 text-orange-700",
  Tarih: "bg-amber-100 text-amber-700",
  Coğrafya: "bg-teal-100 text-teal-700",
  İngilizce: "bg-indigo-100 text-indigo-700",
  Felsefe: "bg-rose-100 text-rose-700",
};

function UserAvatar({ name, photo, role, size = "sm" }: { name: string; photo?: string; role?: string; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-10 h-10 text-base" : "w-8 h-8 text-sm";
  const roleBg = role === "teacher" ? "bg-teal-600" : "bg-slate-300";
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo} alt={name} className={`${sz} rounded-xl object-cover shrink-0`} />
  ) : (
    <div className={`${sz} rounded-xl ${roleBg} flex items-center justify-center text-white font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface NewPostModalProps {
  onClose: () => void;
  onCreated: (post: ForumPost) => void;
  token: string;
}
function NewPostModal({ onClose, onCreated, token }: NewPostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError("Başlık ve içerik zorunlu."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.createForumPost(token, { title: title.trim(), content: content.trim(), subject: subject || undefined });
      onCreated(res.post);
    } catch (e) {
      setError((e as Error).message || "Gönderi oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">Yeni Soru Sor</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Başlık *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sorunuzu kısaca özetleyin..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ders</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {SUBJECTS.map((s) => <option key={s} value={s}>{s || "Ders seçin (opsiyonel)"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Açıklama *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Sorunuzu detaylı açıklayın, ne denediğinizi belirtin..."
              rows={5}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Gönderiliyor..." : "Soruyu Gönder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PostDetailProps {
  postId: number;
  token: string;
  user: { name: string; role?: string } | null;
  onBack: () => void;
}
function PostDetail({ postId, token, user, onBack }: PostDetailProps) {
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getForumPost(token, postId);
        setPost(res.post);
        setReplies(res.replies ?? []);
      } catch {
        setError("Gönderi yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, postId]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await api.createForumReply(token, postId, replyText.trim());
      setReplies((prev) => [...prev, res.reply]);
      setReplyText("");
    } catch (e) {
      setError((e as Error).message || "Yanıt gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await api.likeForumPost(token, postId);
      setPost((p) => p ? { ...p, is_liked: res.liked, like_count: res.like_count } : p);
    } catch { /* ignore */ }
  };

  const handleMarkBest = async (replyId: number) => {
    try {
      await api.markForumReplyBest(token, postId, replyId);
      setReplies((prev) => prev.map((r) => ({ ...r, is_best_answer: r.id === replyId })));
      setPost((p) => p ? { ...p, is_solved: true } : p);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!post) return <div className="text-center py-12 text-slate-400">{error || "Gönderi bulunamadı"}</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Forum Listesi
      </button>

      {/* Post */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <UserAvatar name={post.author_name} photo={post.author_photo} role={post.author_role} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-bold text-slate-900 text-lg leading-snug">{post.title}</h1>
              {post.is_solved && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                  <CheckCircle className="w-3.5 h-3.5" /> Çözüldü
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-medium text-slate-700">{post.author_name}</span>
              {post.author_role === "teacher" && (
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Öğretmen</span>
              )}
              <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
              {post.subject && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SUBJECT_COLORS[post.subject] ?? "bg-slate-100 text-slate-600"}`}>
                  {post.subject}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-4 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.is_liked ? "text-teal-600" : "text-slate-400 hover:text-teal-600"}`}
          >
            <ThumbsUp className="w-4 h-4" /> {post.like_count}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-slate-400">
            <Eye className="w-4 h-4" /> {post.views ?? 0}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-slate-400">
            <MessageSquare className="w-4 h-4" /> {replies.length} yanıt
          </span>
        </div>
      </div>

      {/* Yanıtlar */}
      {replies.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-slate-900 text-sm px-1">Yanıtlar ({replies.length})</h2>
          {replies.map((reply) => (
            <div
              key={reply.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm ${reply.is_best_answer ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"}`}
            >
              {reply.is_best_answer && (
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold mb-3">
                  <Star className="w-3.5 h-3.5 fill-emerald-500" /> En İyi Yanıt
                </div>
              )}
              <div className="flex items-start gap-3">
                <UserAvatar name={reply.author_name} photo={reply.author_photo} role={reply.author_role} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-800">{reply.author_name}</span>
                    {reply.author_role === "teacher" && (
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Öğretmen</span>
                    )}
                    <span className="text-xs text-slate-400">{timeAgo(reply.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                  {!reply.is_best_answer && post.author_name === user?.name && (
                    <button
                      onClick={() => handleMarkBest(reply.id)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> En İyi Yanıt Olarak İşaretle
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yanıt yaz */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Yanıt Yaz</h3>
        {error && (
          <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <textarea
          ref={replyRef}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Yanıtınızı yazın..."
          rows={3}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleReply}
            disabled={!replyText.trim() || sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Yanıtla
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForumPage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [sort, setSort] = useState("latest");
  const [error, setError] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPosts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getForumPosts(token, {
        subject: subject || undefined,
        search: search || undefined,
        sort,
        page,
      });
      setPosts(res.data ?? []);
      setTotal(res.total ?? 0);
      setLastPage(res.last_page ?? 1);
    } catch (e) {
      setError((e as Error).message || "Forum yüklenemedi");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [token, subject, search, sort, page]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { /* loadPosts debounced via state */ }, 400);
  }, [search]);

  if (selectedPostId !== null && token) {
    return (
      <div className="p-8 lg:p-12">
        <PostDetail
          postId={selectedPostId}
          token={token}
          user={user}
          onBack={() => { setSelectedPostId(null); loadPosts(); }}
        />
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forum & Soru-Cevap</h1>
          <p className="text-slate-600 mt-1">Soru sor, cevap ver, birlikte öğren · {total} gönderi</p>
        </div>
        <button
          onClick={() => setShowNewPost(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-teal-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Soru Sor</span>
          <span className="sm:hidden">Sor</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={loadPosts} className="ml-auto text-red-600 font-semibold hover:underline text-xs">Yenile</button>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl px-3 focus-within:ring-2 focus-within:ring-teal-400">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Soru ara..."
            className="flex-1 py-2.5 text-sm outline-none bg-transparent"
          />
          {search && (
            <button onClick={() => handleSearchChange("")} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setPage(1); }}
            className="text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
          >
            {SUBJECTS.map((s) => <option key={s} value={s}>{s || "Tüm Dersler"}</option>)}
          </select>
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="text-sm px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
        >
          <option value="latest">En Yeni</option>
          <option value="popular">En Popüler</option>
          <option value="unanswered">Cevaplanmamış</option>
        </select>
        <button
          onClick={() => { setLoading(true); loadPosts(); }}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Post Listesi */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">
            {search || subject ? "Arama kriterlerine uygun gönderi bulunamadı." : "Henüz gönderi yok."}
          </p>
          <p className="text-sm text-slate-400 mt-1">İlk soruyu sen sor!</p>
          <button
            onClick={() => setShowNewPost(true)}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" /> Soru Sor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPostId(post.id)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-teal-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <UserAvatar name={post.author_name} photo={post.author_photo} role={post.author_role} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors text-sm line-clamp-2 flex-1">
                      {post.title}
                    </h3>
                    {post.is_solved && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="font-medium text-slate-600">{post.author_name}</span>
                    {post.author_role === "teacher" && (
                      <span className="font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">Öğretmen</span>
                    )}
                    <span>{timeAgo(post.created_at)}</span>
                    {post.subject && (
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${SUBJECT_COLORS[post.subject] ?? "bg-slate-100 text-slate-500"}`}>
                        {post.subject}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> {post.reply_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" /> {post.like_count}
                    </span>
                    {post.views !== undefined && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {post.views}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Önceki
          </button>
          <span className="text-sm text-slate-500 font-medium">{page} / {lastPage}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, lastPage))}
            disabled={page === lastPage || loading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Sonraki
          </button>
        </div>
      )}

      {showNewPost && token && (
        <NewPostModal
          token={token}
          onClose={() => setShowNewPost(false)}
          onCreated={(post) => {
            setPosts((prev) => [post, ...prev]);
            setTotal((t) => t + 1);
            setShowNewPost(false);
            setSelectedPostId(post.id);
          }}
        />
      )}
    </div>
  );
}

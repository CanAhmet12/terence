"use client";

import { useState, useEffect } from "react";
import { Bell, X, BellOff } from "lucide-react";
import { api } from "@/lib/api";

interface PushPermissionBannerProps {
  token: string | null;
}

export function PushPermissionBanner({ token }: PushPermissionBannerProps) {
  const [show, setShow] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    // Bildirim API desteği ve henüz izin verilmemişse göster
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      Notification.permission === "default"
    ) {
      // Kullanıcı daha önce "sonra sor" seçtiyse 3 günlük gecikme
      const dismissed = localStorage.getItem("push-banner-dismissed");
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return;
      }
      setShow(true);
    }
  }, []);

  const handleEnable = async () => {
    setRegistering(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Service Worker kayıt
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        
        // Varsa push subscription al
        try {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY || undefined,
          });
          if (token && sub.endpoint) {
            await api.registerPushToken(token, sub.endpoint, "web");
          }
        } catch {
          // VAPID key yoksa sessizce geç
        }
        setShow(false);
        localStorage.removeItem("push-banner-dismissed");
      } else {
        setShow(false);
      }
    } catch {
      setShow(false);
    } finally {
      setRegistering(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("push-banner-dismissed", String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="mx-8 mt-4 flex items-center gap-4 p-4 bg-teal-50 border border-teal-200 rounded-2xl shadow-sm animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm">Bildirimleri Aç</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Plan hatırlatmaları, ödev bildirimleri ve koç mesajlarını kaçırma.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleEnable}
          disabled={registering}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
        >
          {registering ? "Açılıyor..." : "Aç"}
        </button>
        <button
          onClick={handleDismiss}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-xl hover:bg-slate-100"
          title="Sonra sor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

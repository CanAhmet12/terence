"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray.buffer;
}

export function usePushNotifications() {
  const { token } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Service Worker kaydet
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (!token || !VAPID_PUBLIC_KEY) return;

        // Push izni iste
        return Notification.requestPermission().then(async (permission) => {
          if (permission !== "granted") return;

          const existingSub = await registration.pushManager.getSubscription();
          if (existingSub) {
            // Zaten abone
            return registerWithServer(token, existingSub);
          }

          // Yeni abonelik oluştur
          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          return registerWithServer(token, sub);
        });
      })
      .catch(() => {
        // Service worker kaydı sessizce başarısız
      });
  }, [token]);
}

async function registerWithServer(token: string, sub: PushSubscription) {
  const subJson = sub.toJSON();
  const pushToken = JSON.stringify(subJson);
  try {
    await api.registerPushToken(token, pushToken, "web");
  } catch {
    // Sessizce geç
  }
}

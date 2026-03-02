import { useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  minEth: number;
}

export interface AppNotification {
  id: string;
  hash: string;
  valueEth: number;
  valueUsd: number;
  from: string;
  timestamp: number;
  read: boolean;
}

const STORAGE_KEY = 'whale-notif-settings';
const MAX_NOTIFICATIONS = 50;

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: false,
  minEth: 100,
};

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Init audio
  useEffect(() => {
    audioRef.current = new Audio('/mixkit-long-pop-2358.wav');
    audioRef.current.volume = 0.5;
  }, []);

  const showToast = useCallback((notif: AppNotification) => {
    setToast(notif);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // Listen for whale events
  useEffect(() => {
    const handler = (e: Event) => {
      const tx = (e as CustomEvent).detail;
      if (!settings.enabled) return;
      if (tx.valueEth < settings.minEth) return;

      const notif: AppNotification = {
        id: tx.hash,
        hash: tx.hash,
        valueEth: tx.valueEth,
        valueUsd: tx.valueUsd,
        from: tx.from,
        timestamp: tx.timestamp,
        read: false,
      };

      setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
      showToast(notif);

      // Sound
      if (settings.sound && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      // Desktop
      if (settings.desktop && Notification.permission === 'granted') {
        const eth = tx.valueEth >= 10000
          ? `${(tx.valueEth / 1000).toFixed(1)}K`
          : tx.valueEth.toFixed(1);
        new Notification(`🐋 ${eth} ETH whale detected`, {
          body: `From ${tx.from.slice(0, 8)}…${tx.from.slice(-6)}`,
          icon: '/favicon.ico',
        });
      }
    };

    window.addEventListener('new-whale', handler);
    return () => window.removeEventListener('new-whale', handler);
  }, [settings, showToast]);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestDesktopPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      updateSettings({ desktop: true });
      return true;
    }
    return false;
  }, [updateSettings]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    settings,
    updateSettings,
    notifications,
    toast,
    closeToast,
    unreadCount,
    markAllRead,
    clearAll,
    requestDesktopPermission,
  };
}

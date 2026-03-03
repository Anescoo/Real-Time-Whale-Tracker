import { useState, useEffect, useCallback, useRef } from 'react';

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  minThresholds: Record<string, number>;
}

export interface AppNotification {
  id: string;
  hash: string;
  valueEth: number;
  valueUsd: number;
  from: string;
  timestamp: number;
  read: boolean;
  network: string;
}

const STORAGE_KEY = 'whale-notif-settings';
const MAX_NOTIFICATIONS = 50;

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: false,
  minThresholds: { 'eth-mainnet': 100, 'bitcoin': 50 },
};

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate from old single-threshold format
      if ('minEth' in parsed && !('minThresholds' in parsed)) {
        return { ...DEFAULT_SETTINGS, ...parsed, minThresholds: { 'eth-mainnet': parsed.minEth, 'bitcoin': 50 } };
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(loadSettings);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastToastTimeRef = useRef<number>(0);
  const lastSoundTimeRef = useRef<number>(0);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Init audio
  useEffect(() => {
    audioRef.current = new Audio('/mixkit-long-pop-2358.wav');
    audioRef.current.volume = 0.5;
  }, []);

  const TOAST_COOLDOWN = 3_000; // ms between toast popups
  const SOUND_COOLDOWN = 5_000; // ms between sounds

  const showToast = useCallback((notif: AppNotification) => {
    const now = Date.now();
    if (now - lastToastTimeRef.current < TOAST_COOLDOWN) return;
    lastToastTimeRef.current = now;
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
      const threshold = settings.minThresholds[tx.network] ?? settings.minThresholds['eth-mainnet'] ?? 100;
      if (tx.valueEth < threshold) return;

      const notif: AppNotification = {
        id: tx.hash,
        hash: tx.hash,
        valueEth: tx.valueEth,
        valueUsd: tx.valueUsd,
        from: tx.from,
        timestamp: tx.timestamp,
        read: false,
        network: tx.network ?? 'eth-mainnet',
      };

      setNotifications((prev) => [notif, ...prev].slice(0, MAX_NOTIFICATIONS));
      showToast(notif);

      // Sound (rate-limited)
      const nowSound = Date.now();
      if (settings.sound && audioRef.current && nowSound - lastSoundTimeRef.current >= SOUND_COOLDOWN) {
        lastSoundTimeRef.current = nowSound;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      // Desktop
      if (settings.desktop && Notification.permission === 'granted') {
        const SYMBOLS: Record<string, string> = { 'eth-mainnet': 'ETH', 'bitcoin': 'BTC', 'polygon-mainnet': 'POL' };
        const sym = SYMBOLS[tx.network] ?? tx.network.toUpperCase();
        const amount = tx.valueEth >= 10000
          ? `${(tx.valueEth / 1000).toFixed(1)}K`
          : tx.valueEth.toFixed(2);
        new Notification(`🐋 ${amount} ${sym} whale detected`, {
          body: tx.valueUsd > 0
            ? `≈ €${tx.valueUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
            : `From ${tx.from.slice(0, 8)}…${tx.from.slice(-6)}`,
          icon: '/favicon.ico',
          tag: tx.hash,
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

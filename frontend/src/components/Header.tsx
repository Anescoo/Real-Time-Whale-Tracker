import { useState, useRef, useEffect } from 'react';
import { ConnectionStatus } from '../hooks/useWebSocket';
import { useNotifications } from '../hooks/useNotifications';
import { NetworkInfo } from './NetworkSelector';
import { NotificationBell } from './Notifications/NotificationBell';
import { NotificationPanel } from './Notifications/NotificationPanel';
import { NotificationToast } from './Notifications/NotificationToast';

interface Props {
  status: ConnectionStatus;
  connectedClients: number;
  ethPrice: number;
  symbol: string;
  networks: NetworkInfo[];
}

const statusLabel: Record<ConnectionStatus, string> = {
  connected: 'Live',
  connecting: 'Connecting',
  disconnected: 'Offline',
  error: 'Error',
};

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('whale-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('whale-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, toggle };
}

export function Header({ status, connectedClients, ethPrice, symbol, networks }: Props) {
  const { theme, toggle: toggleTheme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    settings,
    updateSettings,
    notifications,
    toast,
    closeToast,
    unreadCount,
    markAllRead,
    clearAll,
    requestDesktopPermission,
  } = useNotifications();

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  const handleBellClick = () => {
    setPanelOpen((v) => !v);
    if (!panelOpen) markAllRead();
  };

  return (
    <>
      <header className="header">
        <div className="header-brand">
          <span style={{ fontSize: 22 }}>🐋</span>
          <div>
            <h1>Whale Tracker</h1>
          </div>
        </div>

        <div className="header-right">
          {ethPrice > 0 && (
            <div className="eth-price-badge">
              {symbol} €{ethPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          )}

          <div className="header-stat">
            <span>👥</span>
            <span>{connectedClients}</span>
          </div>

          <div className="header-stat">
            <div className={`status-dot ${status}`} />
            <span>{statusLabel[status]}</span>
          </div>

          {/* Theme toggle */}
          <button
            className="theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              /* Sun */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              /* Moon */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Notification bell + dropdown */}
          <div ref={panelRef} style={{ position: 'relative' }}>
            <NotificationBell
              unreadCount={unreadCount}
              isOpen={panelOpen}
              onClick={handleBellClick}
            />
            {panelOpen && (
              <div className="notif-dropdown">
                <NotificationPanel
                  notifications={notifications}
                  settings={settings}
                  onSettingsChange={updateSettings}
                  onRequestDesktop={requestDesktopPermission}
                  onMarkAllRead={markAllRead}
                  onClearAll={clearAll}
                  networks={networks}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationToast toast={toast} onClose={closeToast} />
    </>
  );
}

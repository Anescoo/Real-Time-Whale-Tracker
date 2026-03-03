import { useState } from 'react';
import { AppNotification, NotificationSettings } from '../../hooks/useNotifications';
import { NotificationSettings as SettingsPanel } from './NotificationSettings';
import { NetworkInfo } from '../NetworkSelector';

interface Props {
  notifications: AppNotification[];
  settings: NotificationSettings;
  onSettingsChange: (patch: Partial<NotificationSettings>) => void;
  onRequestDesktop: () => Promise<boolean>;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  networks: NetworkInfo[];
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtEth(eth: number) {
  if (eth >= 10000) return `${(eth / 1000).toFixed(1)}K`;
  return eth.toFixed(1);
}

function amountClass(eth: number) {
  if (eth >= 1000) return 'amount-xxl';
  if (eth >= 500) return 'amount-xl';
  return 'amount-lg';
}

export function NotificationPanel({
  notifications,
  settings,
  onSettingsChange,
  onRequestDesktop,
  onMarkAllRead,
  onClearAll,
  networks,
}: Props) {
  const [view, setView] = useState<'list' | 'settings'>('list');
  const networkMap = Object.fromEntries(networks.map((n) => [n.id, n]));

  if (view === 'settings') {
    return (
      <SettingsPanel
        settings={settings}
        onChange={onSettingsChange}
        onRequestDesktop={onRequestDesktop}
        onBack={() => setView('list')}
        networks={networks}
      />
    );
  }

  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <span className="notif-panel-title">
          Notifications
          {notifications.length > 0 && (
            <span className="section-count">{notifications.length}</span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {notifications.length > 0 && (
            <>
              <button className="notif-action-btn" onClick={onMarkAllRead} title="Mark all read">
                ✓
              </button>
              <button className="notif-action-btn" onClick={onClearAll} title="Clear all">
                ✕
              </button>
            </>
          )}
          <button className="notif-action-btn" onClick={() => setView('settings')} title="Settings">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <div style={{ fontSize: 28, opacity: 0.3, marginBottom: 8 }}>🔔</div>
            <div>No notifications yet</div>
          </div>
        ) : (
          notifications.map((n) => {
            const usd = n.valueUsd > 0 ? n.valueUsd : 0;
            return (
              <div key={n.id} className={`notif-item${n.read ? ' notif-item-read' : ''}`}>
                {!n.read && <span className="notif-dot" />}
                <div className="notif-item-body">
                  <div className={`notif-item-eth ${amountClass(n.valueEth)}`}>
                    {fmtEth(n.valueEth)} {networkMap[n.network]?.symbol ?? 'ETH'}
                  </div>
                  {usd > 0 && (
                    <div className="notif-item-usd">
                      ≈ ${usd >= 1_000_000
                        ? `${(usd / 1_000_000).toFixed(2)}M`
                        : usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  )}
                  <div className="notif-item-from">
                    {n.from.slice(0, 8)}…{n.from.slice(-6)}
                  </div>
                </div>
                <div className="notif-item-time">{timeAgo(n.timestamp)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

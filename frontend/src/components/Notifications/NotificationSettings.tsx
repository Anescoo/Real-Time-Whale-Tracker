import { NotificationSettings as Settings } from '../../hooks/useNotifications';
import { NetworkInfo } from '../NetworkSelector';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onRequestDesktop: () => Promise<boolean>;
  onBack: () => void;
  networks: NetworkInfo[];
}

const desktopPermission = () =>
  'Notification' in window ? Notification.permission : 'denied';

export function NotificationSettings({ settings, onChange, onRequestDesktop, onBack, networks }: Props) {
  const perm = desktopPermission();
  const activeNetworks = networks.filter((n) => n.provider !== 'coming_soon');

  const handleDesktopToggle = async () => {
    if (!settings.desktop) {
      if (perm === 'granted') {
        onChange({ desktop: true });
      } else if (perm !== 'denied') {
        await onRequestDesktop();
      }
    } else {
      onChange({ desktop: false });
    }
  };

  return (
    <div className="notif-settings">
      <div className="notif-settings-header">
        <button className="notif-back-btn" onClick={onBack} aria-label="Back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="notif-settings-title">Notification settings</span>
      </div>

      <div className="notif-settings-body">
        {/* Master toggle */}
        <div className="notif-setting-row">
          <div>
            <div className="notif-setting-label">Enable notifications</div>
            <div className="notif-setting-desc">Receive alerts for whale transactions</div>
          </div>
          <button
            className={`notif-toggle ${settings.enabled ? 'notif-toggle-on' : ''}`}
            onClick={() => onChange({ enabled: !settings.enabled })}
            role="switch"
            aria-checked={settings.enabled}
          >
            <span className="notif-toggle-thumb" />
          </button>
        </div>

        {/* Sound */}
        <div className={`notif-setting-row${!settings.enabled ? ' notif-setting-disabled' : ''}`}>
          <div>
            <div className="notif-setting-label">Sound</div>
            <div className="notif-setting-desc">Play a sound on new whale</div>
          </div>
          <button
            className={`notif-toggle ${settings.sound && settings.enabled ? 'notif-toggle-on' : ''}`}
            onClick={() => settings.enabled && onChange({ sound: !settings.sound })}
            role="switch"
            aria-checked={settings.sound}
            disabled={!settings.enabled}
          >
            <span className="notif-toggle-thumb" />
          </button>
        </div>

        {/* Desktop */}
        <div className={`notif-setting-row${!settings.enabled ? ' notif-setting-disabled' : ''}`}>
          <div>
            <div className="notif-setting-label">Desktop notifications</div>
            <div className="notif-setting-desc">
              {perm === 'denied'
                ? 'Blocked — enable in browser settings'
                : perm === 'default'
                ? 'Click to request permission'
                : 'Show OS notifications'}
            </div>
          </div>
          <button
            className={`notif-toggle ${settings.desktop && settings.enabled ? 'notif-toggle-on' : ''}`}
            onClick={() => settings.enabled && handleDesktopToggle()}
            role="switch"
            aria-checked={settings.desktop}
            disabled={!settings.enabled || perm === 'denied'}
          >
            <span className="notif-toggle-thumb" />
          </button>
        </div>

        {/* Per-network thresholds */}
        <div className={`notif-setting-row notif-setting-col${!settings.enabled ? ' notif-setting-disabled' : ''}`}>
          <div className="notif-setting-label" style={{ marginBottom: 8 }}>Thresholds by network</div>
          {activeNetworks.map((net) => {
            const val = settings.minThresholds[net.id] ?? net.threshold;
            return (
              <div key={net.id} style={{ marginBottom: 16, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: net.color, fontWeight: 600 }}>{net.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>
                    {val}&nbsp;<span style={{ color: 'var(--text-2)', fontSize: 11 }}>{net.symbol}</span>
                  </span>
                </div>
                <input
                  type="range"
                  className="filter-range"
                  style={{ width: '100%' }}
                  min={net.sliderMin}
                  max={net.sliderMax}
                  step={net.sliderStep}
                  value={val}
                  onChange={(e) => onChange({ minThresholds: { ...settings.minThresholds, [net.id]: Number(e.target.value) } })}
                  disabled={!settings.enabled}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { NotificationSettings as Settings } from '../../hooks/useNotifications';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onRequestDesktop: () => Promise<boolean>;
  onBack: () => void;
}

const desktopPermission = () =>
  'Notification' in window ? Notification.permission : 'denied';

export function NotificationSettings({ settings, onChange, onRequestDesktop, onBack }: Props) {
  const perm = desktopPermission();

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

        {/* Min ETH */}
        <div className={`notif-setting-row notif-setting-col${!settings.enabled ? ' notif-setting-disabled' : ''}`}>
          <div>
            <div className="notif-setting-label">Minimum threshold</div>
            <div className="notif-setting-desc">Only notify above this amount</div>
          </div>
          <div className="notif-slider-row">
            <input
              type="range"
              className="filter-range"
              min={100}
              max={2000}
              step={100}
              value={settings.minEth}
              onChange={(e) => onChange({ minEth: Number(e.target.value) })}
              disabled={!settings.enabled}
            />
            <span className="filter-amount-value">{settings.minEth} ETH</span>
          </div>
        </div>
      </div>
    </div>
  );
}

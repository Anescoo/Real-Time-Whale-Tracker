import { AppNotification } from '../../hooks/useNotifications';

interface Props {
  toast: AppNotification | null;
  onClose: () => void;
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

export function NotificationToast({ toast, onClose }: Props) {
  if (!toast) return null;

  const usd = toast.valueUsd > 0 ? toast.valueUsd : 0;

  return (
    <div className="notif-toast" role="alert">
      <div className="notif-toast-inner">
        <div className="notif-toast-left">
          <span style={{ fontSize: 16 }}>🐋</span>
          <div>
            <div className={`notif-toast-eth ${amountClass(toast.valueEth)}`}>
              {fmtEth(toast.valueEth)} ETH
            </div>
            {usd > 0 && (
              <div className="notif-toast-usd">
                ≈ ${usd >= 1_000_000
                  ? `${(usd / 1_000_000).toFixed(2)}M`
                  : usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            )}
            <div className="notif-toast-from">
              {toast.from.slice(0, 8)}…{toast.from.slice(-6)}
            </div>
          </div>
        </div>
        <button className="notif-toast-close" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}

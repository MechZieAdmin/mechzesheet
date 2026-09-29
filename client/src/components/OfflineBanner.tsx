/**
 * OfflineBanner — Network status indicator
 * 
 * Renders a subtle animated banner at the top of the screen
 * when the user is offline. Auto-hides when connectivity returns.
 */
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNetworkStatus } from '../lib/networkStatus';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Just came back online — show reconnected briefly
      setShowReconnected(true);
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-out ${
        show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className={`flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide ${
          showReconnected
            ? 'bg-green-500/90 text-white backdrop-blur-md'
            : 'bg-amber-500/90 text-black backdrop-blur-md'
        }`}
      >
        {showReconnected ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            Back online — syncing your data
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            You're offline — showing cached data
          </>
        )}
      </div>
    </div>
  );
}

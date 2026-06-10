import { useCallback, useEffect, useState } from 'react';
import {
  NETWORK_RESTORED_EVENT,
  NETWORK_UNREACHABLE_EVENT,
  isBrowserOnline,
} from '../utils/networkStatus';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(isBrowserOnline);
  const [connectivityFailed, setConnectivityFailed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectivityFailed(false);
    };
    const handleOffline = () => setIsOnline(false);
    const handleUnreachable = () => setConnectivityFailed(true);
    const handleRestored = () => setConnectivityFailed(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(NETWORK_UNREACHABLE_EVENT, handleUnreachable);
    window.addEventListener(NETWORK_RESTORED_EVENT, handleRestored);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(NETWORK_UNREACHABLE_EVENT, handleUnreachable);
      window.removeEventListener(NETWORK_RESTORED_EVENT, handleRestored);
    };
  }, []);

  const isOffline = !isOnline || connectivityFailed;

  const retryConnection = useCallback(() => {
    if (isBrowserOnline()) {
      setConnectivityFailed(false);
      window.location.reload();
      return;
    }
    setIsOnline(false);
  }, []);

  return { isOnline, connectivityFailed, isOffline, retryConnection };
}

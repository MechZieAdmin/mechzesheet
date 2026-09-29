/**
 * Network Status Hook & Utilities
 * 
 * Monitors connectivity using Capacitor Network plugin (native)
 * or navigator.onLine (web). Provides a React hook for components
 * and triggers pending action sync when connectivity is restored.
 */
import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { toast } from 'sonner';
import { getPendingActions, removePendingAction } from './offlineDb';
import api from './api';

export interface NetworkState {
  isOnline: boolean;
  connectionType: string;
}

/**
 * Get current network status
 */
export async function getNetworkStatus(): Promise<NetworkState> {
  if (Capacitor.isNativePlatform()) {
    const status = await Network.getStatus();
    return {
      isOnline: status.connected,
      connectionType: status.connectionType,
    };
  }

  return {
    isOnline: navigator.onLine,
    connectionType: navigator.onLine ? 'wifi' : 'none',
  };
}

/**
 * Sync pending offline actions when back online
 */
async function syncPendingActions(): Promise<void> {
  const actions = await getPendingActions();
  if (actions.length === 0) return;

  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      switch (action.method.toUpperCase()) {
        case 'POST':
          await api.post(action.url, action.data);
          break;
        case 'PUT':
          await api.put(action.url, action.data);
          break;
        case 'PATCH':
          await api.patch(action.url, action.data);
          break;
        case 'DELETE':
          await api.delete(action.url);
          break;
      }
      if (action.id) {
        await removePendingAction(action.id);
      }
      synced++;
    } catch {
      failed++;
    }
  }

  if (synced > 0) {
    toast.success(`Synced ${synced} pending action${synced > 1 ? 's' : ''}`);
  }
  if (failed > 0) {
    toast.error(
      `Failed to sync ${failed} action${failed > 1 ? 's' : ''}. Will retry later.`
    );
  }
}

/**
 * React hook for network status monitoring
 */
export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isOnline: true,
    connectionType: 'wifi',
  });

  const handleStatusChange = useCallback(
    (status: ConnectionStatus) => {
      const newOnline = status.connected;
      const wasOffline = !state.isOnline;

      setState({
        isOnline: newOnline,
        connectionType: status.connectionType,
      });

      if (newOnline && wasOffline) {
        toast.success('Back online!', {
          description: 'Syncing your data...',
          duration: 3000,
        });
        syncPendingActions();
      } else if (!newOnline) {
        toast.warning('You are offline', {
          description: 'Showing cached data. Changes will sync when online.',
          duration: 5000,
        });
      }
    },
    [state.isOnline]
  );

  useEffect(() => {
    // Get initial status
    getNetworkStatus().then(setState);

    if (Capacitor.isNativePlatform()) {
      // Capacitor Network listener
      const listener = Network.addListener(
        'networkStatusChange',
        handleStatusChange
      );

      return () => {
        listener.then((l) => l.remove());
      };
    } else {
      // Web fallback
      const handleOnline = () =>
        handleStatusChange({ connected: true, connectionType: 'wifi' });
      const handleOffline = () =>
        handleStatusChange({ connected: false, connectionType: 'none' });

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [handleStatusChange]);

  return state;
}

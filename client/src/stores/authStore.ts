import { create } from 'zustand';
import api from '../lib/api';
import { cacheUserData, getCachedUserData, clearAllCaches } from '../lib/offlineDb';
import {
  isBiometricAvailable,
  isBiometricLoginEnabled,
  authenticateWithBiometric,
  getBiometricCredentials,
  enableBiometricLogin,
  disableBiometricLogin,
  type BiometricStatus,
} from '../lib/biometric';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'hr' | 'employee';
  employeeId?: number;
  name: string;
  department?: string;
  designation?: string;
  photoUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Biometric state
  biometricStatus: BiometricStatus;
  biometricEnabled: boolean;
  showBiometricPrompt: boolean;
  showEnableBiometricModal: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Biometric actions
  checkBiometricAvailability: () => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  enableBiometric: (email: string, password: string) => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  setShowBiometricPrompt: (show: boolean) => void;
  setShowEnableBiometricModal: (show: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Biometric state
  biometricStatus: { isAvailable: false, biometryType: 'none' },
  biometricEnabled: false,
  showBiometricPrompt: false,
  showEnableBiometricModal: false,

  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Cache user data for offline access
    try {
      await cacheUserData(String(user.id), user);
    } catch {
      // Best-effort caching
    }

    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Clear offline caches on logout
    try {
      await clearAllCaches();
    } catch {
      // Best-effort cleanup
    }

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      showBiometricPrompt: false,
      showEnableBiometricModal: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (!token || !savedUser) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const user = res.data;

      // Update cache with fresh data
      try {
        await cacheUserData(String(user.id), user);
      } catch {
        // Best-effort
      }

      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // If offline, try to use cached user data
      if (!navigator.onLine) {
        try {
          const parsed = JSON.parse(savedUser);
          const cachedUser = await getCachedUserData(String(parsed.id));
          if (cachedUser) {
            set({
              user: cachedUser,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        } catch {
          // Fall through to use localStorage
        }

        // Fallback to localStorage user
        try {
          const user = JSON.parse(savedUser);
          set({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          // Invalid JSON, fall through
        }
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // ── Biometric Actions ──────────────────────────────────────

  checkBiometricAvailability: async () => {
    const status = await isBiometricAvailable();
    const enabled = await isBiometricLoginEnabled();
    set({ biometricStatus: status, biometricEnabled: enabled });
  },

  loginWithBiometric: async () => {
    const { biometricStatus } = get();
    if (!biometricStatus.isAvailable) return false;

    set({ showBiometricPrompt: true });

    const authenticated = await authenticateWithBiometric();
    if (!authenticated) {
      set({ showBiometricPrompt: false });
      return false;
    }

    const credentials = await getBiometricCredentials();
    if (!credentials) {
      set({ showBiometricPrompt: false });
      return false;
    }

    try {
      await get().login(credentials.email, credentials.password);
      set({ showBiometricPrompt: false });
      return true;
    } catch {
      set({ showBiometricPrompt: false });
      return false;
    }
  },

  enableBiometric: async (email: string, password: string) => {
    const success = await enableBiometricLogin(email, password);
    if (success) {
      set({ biometricEnabled: true, showEnableBiometricModal: false });
    }
    return success;
  },

  disableBiometric: async () => {
    await disableBiometricLogin();
    set({ biometricEnabled: false });
  },

  setShowBiometricPrompt: (show: boolean) =>
    set({ showBiometricPrompt: show }),

  setShowEnableBiometricModal: (show: boolean) =>
    set({ showEnableBiometricModal: show }),
}));

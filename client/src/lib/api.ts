import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { cacheApiResponse, getCachedApiResponse, queuePendingAction } from './offlineDb';

// Determine base URL:
// - Native (Capacitor): use the full backend URL
// - Web (dev server): use Vite proxy ('/api')
const BASE_URL = Capacitor.isNativePlatform()
  ? 'https://api.mechzie.com/api'  // TODO: Replace with your production API URL
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach JWT token ─────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — handle 401, caching & offline ───

api.interceptors.response.use(
  async (response) => {
    // Cache successful GET responses for offline use
    if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
      try {
        const cacheKey = response.config.url + (response.config.params ? JSON.stringify(response.config.params) : '');
        await cacheApiResponse(cacheKey, response.data);
      } catch {
        // Caching is best-effort, don't break the flow
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ── Offline handling ────────────────────────────────────
    if (!navigator.onLine || error.code === 'ERR_NETWORK') {
      const method = originalRequest.method?.toLowerCase();

      // For GET requests, try to return cached data
      if (method === 'get' && originalRequest.url) {
        const cacheKey = originalRequest.url + (originalRequest.params ? JSON.stringify(originalRequest.params) : '');
        const cached = await getCachedApiResponse(cacheKey);
        if (cached) {
          return {
            data: cached,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config: originalRequest,
            _fromCache: true,
          } as any;
        }
      }

      // For mutation requests, queue for later sync
      if (['post', 'put', 'patch', 'delete'].includes(method || '')) {
        await queuePendingAction(
          method!.toUpperCase(),
          originalRequest.url || '',
          originalRequest.data ? JSON.parse(originalRequest.data) : undefined
        );
        return {
          data: { queued: true, message: 'Action queued for sync' },
          status: 202,
          statusText: 'Queued',
          headers: {},
          config: originalRequest,
          _queued: true,
        } as any;
      }
    }

    // ── Token refresh on 401 ───────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { accessToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

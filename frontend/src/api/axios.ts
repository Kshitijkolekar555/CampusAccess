import axios, { AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper: build a silent empty-success response for 403/forbidden background queries
const silentEmptyResponse = (originalRequest: any): AxiosResponse => ({
  data: { success: true, statusCode: 200, message: 'OK', data: null },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: originalRequest,
} as any);

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Silently absorb 403 on GET requests — guards will hit these due to role restrictions
    // This prevents "Access denied" toasts from background data-fetch queries
    if (status === 403 && originalRequest?.method?.toLowerCase() === 'get') {
      return Promise.resolve(silentEmptyResponse(originalRequest));
    }

    // Auto Refresh Token on 401
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const res = await axios.post(`${window.location.origin}${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          useAuthStore.getState().setTokens(accessToken, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          useAuthStore.getState().logout();
          return Promise.reject(refreshErr);
        }
      } else {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

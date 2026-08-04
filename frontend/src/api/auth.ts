import { api } from './axios';
import { ApiResponse, AuthResponse, User } from '../types';

export const authApi = {
  login: async (credentials: Record<string, string>) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return res.data.data;
  },

  getCurrentUser: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  changePassword: async (data: Record<string, string>) => {
    const res = await api.post<ApiResponse<void>>('/auth/change-password', data);
    return res.data;
  },

  forgotPassword: async (data: { usernameOrEmail: string }) => {
    const res = await api.post<ApiResponse<void>>('/auth/forgot-password', data);
    return res.data;
  },

  resetPassword: async (data: Record<string, string>) => {
    const res = await api.post<ApiResponse<void>>('/auth/reset-password', data);
    return res.data;
  },

  register: async (data: Record<string, any>) => {
    const res = await api.post<ApiResponse<User>>('/auth/register', data);
    return res.data.data;
  },

  verifyPrn: async (prn: string) => {
    const res = await api.post<ApiResponse<any>>(`/auth/verify-prn?prn=${encodeURIComponent(prn)}`);
    return res.data.data;
  },
};

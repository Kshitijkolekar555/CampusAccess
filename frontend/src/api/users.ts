import { api } from './axios';
import { ApiResponse, PageResponse, User } from '../types';

export const userApi = {
  createUser: async (data: any) => {
    const res = await api.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },

  getUserById: async (id: number) => {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  getUsers: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<User>>>('/users', { params });
    return res.data.data;
  },

  updateUser: async (id: number, data: any) => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data;
  },

  updateUserStatus: async (id: number, active: boolean) => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { active });
    return res.data.data;
  },

  updateProfile: async (data: any) => {
    const res = await api.put<ApiResponse<User>>('/users/profile', data);
    return res.data.data;
  },
};

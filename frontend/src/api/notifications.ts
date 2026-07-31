import { api } from './axios';
import { ApiResponse, NotificationItem, PageResponse } from '../types';

export const notificationApi = {
  getNotifications: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<NotificationItem>>>('/notifications', { params });
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get<ApiResponse<NotificationItem>>(`/notifications/${id}`);
    return res.data.data;
  },

  resend: async (id: number) => {
    const res = await api.post<ApiResponse<NotificationItem>>(`/notifications/resend/${id}`);
    return res.data.data;
  },

  deleteNotification: async (id: number) => {
    const res = await api.delete<ApiResponse<void>>(`/notifications/${id}`);
    return res.data;
  },
};

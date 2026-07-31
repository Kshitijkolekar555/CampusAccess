import { api } from './axios';
import { ApiResponse, PageResponse, Visitor } from '../types';

export const visitorApi = {
  checkIn: async (data: any) => {
    const res = await api.post<ApiResponse<Visitor>>('/visitors/check-in', data);
    return res.data.data;
  },

  checkOut: async (data: { visitorId?: number; passNumber?: string; mobile?: string }) => {
    const res = await api.post<ApiResponse<Visitor>>('/visitors/check-out', data);
    return res.data.data;
  },

  getActiveInside: async () => {
    const res = await api.get<ApiResponse<Visitor[]>>('/visitors/inside');
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get<ApiResponse<Visitor>>(`/visitors/${id}`);
    return res.data.data;
  },

  getVisitors: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<Visitor>>>('/visitors', { params });
    return res.data.data;
  },
};

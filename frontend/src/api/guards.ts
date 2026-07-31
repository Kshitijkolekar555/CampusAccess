import { api } from './axios';
import { ApiResponse, Guard, GuardDashboard, PageResponse, Shift, ShiftLog } from '../types';

export const guardApi = {
  createGuard: async (data: any) => {
    const res = await api.post<ApiResponse<Guard>>('/guards', data);
    return res.data.data;
  },

  updateGuard: async (id: number, data: any) => {
    const res = await api.put<ApiResponse<Guard>>(`/guards/${id}`, data);
    return res.data.data;
  },

  getGuardById: async (id: number) => {
    const res = await api.get<ApiResponse<Guard>>(`/guards/${id}`);
    return res.data.data;
  },

  getGuards: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<Guard>>>('/guards', { params });
    return res.data.data;
  },

  startShift: async (data: { gateId: number }) => {
    const res = await api.post<ApiResponse<Shift>>('/guards/shifts/start', data);
    return res.data.data;
  },

  endShift: async () => {
    const res = await api.post<ApiResponse<Shift>>('/guards/shifts/end');
    return res.data.data;
  },

  getCurrentShift: async () => {
    const res = await api.get<ApiResponse<Shift>>('/guards/shifts/current');
    return res.data.data;
  },

  addShiftLog: async (shiftId: number, data: { description: string; logType?: string }) => {
    const res = await api.post<ApiResponse<ShiftLog>>(`/guards/shifts/${shiftId}/logs`, data);
    return res.data.data;
  },

  getShiftLogs: async (shiftId: number, params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<ShiftLog>>>(`/guards/shifts/${shiftId}/logs`, { params });
    return res.data.data;
  },

  getDashboardMetrics: async () => {
    const res = await api.get<ApiResponse<GuardDashboard>>('/guards/dashboard');
    return res.data.data;
  },
};

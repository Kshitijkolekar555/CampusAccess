import { api } from './axios';
import type { ApiResponse, PageResponse, StaffBreak } from '../types';

export const staffBreaksApi = {
  startBreak: async (note?: string): Promise<ApiResponse<StaffBreak>> => {
    const response = await api.post<ApiResponse<StaffBreak>>('/staff/breaks/start', null, {
      params: { note },
    });
    return response.data;
  },

  endBreak: async (note?: string): Promise<ApiResponse<StaffBreak>> => {
    const response = await api.post<ApiResponse<StaffBreak>>('/staff/breaks/end', null, {
      params: { note },
    });
    return response.data;
  },

  getActiveBreak: async (): Promise<ApiResponse<StaffBreak>> => {
    const response = await api.get<ApiResponse<StaffBreak>>('/staff/breaks/active');
    return response.data;
  },

  getHistory: async (page = 0, size = 10): Promise<ApiResponse<PageResponse<StaffBreak>>> => {
    const response = await api.get<ApiResponse<PageResponse<StaffBreak>>>('/staff/breaks/history', {
      params: { page, size },
    });
    return response.data;
  },
};

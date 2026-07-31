import { api } from './axios';
import { ApiResponse, PageResponse, StudentGatePass } from '../types';

export const studentPassApi = {
  createPass: async (data: any) => {
    const res = await api.post<ApiResponse<StudentGatePass>>('/student-passes', data);
    return res.data.data;
  },

  approvePass: async (passId: number, data: { approved: boolean; notes?: string; rejectionReason?: string }) => {
    const res = await api.put<ApiResponse<StudentGatePass>>(`/student-passes/${passId}/approve`, data);
    return res.data.data;
  },

  recordGateExit: async (passId: number, gateId: number) => {
    const res = await api.put<ApiResponse<StudentGatePass>>(`/student-passes/${passId}/exit/${gateId}`);
    return res.data.data;
  },

  recordGateEntry: async (passId: number) => {
    const res = await api.put<ApiResponse<StudentGatePass>>(`/student-passes/${passId}/entry`);
    return res.data.data;
  },

  getById: async (passId: number) => {
    const res = await api.get<ApiResponse<StudentGatePass>>(`/student-passes/${passId}`);
    return res.data.data;
  },

  getPasses: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<StudentGatePass>>>('/student-passes', { params });
    return res.data.data;
  },
};

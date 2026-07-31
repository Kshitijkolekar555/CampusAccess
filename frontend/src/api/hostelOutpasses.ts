import { api } from './axios';
import { ApiResponse, HostelOutpass, PageResponse } from '../types';

export const hostelOutpassApi = {
  createOutpass: async (data: any) => {
    const res = await api.post<ApiResponse<HostelOutpass>>('/hostel-outpasses', data);
    return res.data.data;
  },

  approveOutpass: async (outpassId: number, data: { approved: boolean; wardenRemarks?: string; rejectionReason?: string }) => {
    const res = await api.put<ApiResponse<HostelOutpass>>(`/hostel-outpasses/${outpassId}/approve`, data);
    return res.data.data;
  },

  recordGateExit: async (outpassId: number, gateId: number) => {
    const res = await api.put<ApiResponse<HostelOutpass>>(`/hostel-outpasses/${outpassId}/exit/${gateId}`);
    return res.data.data;
  },

  recordGateEntry: async (outpassId: number) => {
    const res = await api.put<ApiResponse<HostelOutpass>>(`/hostel-outpasses/${outpassId}/entry`);
    return res.data.data;
  },

  getById: async (outpassId: number) => {
    const res = await api.get<ApiResponse<HostelOutpass>>(`/hostel-outpasses/${outpassId}`);
    return res.data.data;
  },

  getOutpasses: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<HostelOutpass>>>('/hostel-outpasses', { params });
    return res.data.data;
  },
};

import { api } from './axios';
import { ApiResponse, PageResponse, Vendor, VendorVisit } from '../types';

export const vendorApi = {
  register: async (data: any) => {
    const res = await api.post<ApiResponse<Vendor>>('/vendors/register', data);
    return res.data.data;
  },

  recordEntry: async (vendorId: number, data: any) => {
    const res = await api.post<ApiResponse<VendorVisit>>(`/vendors/${vendorId}/entry`, data);
    return res.data.data;
  },

  recordExit: async (visitId: number, data?: any) => {
    const res = await api.put<ApiResponse<VendorVisit>>(`/vendors/visits/${visitId}/exit`, data || {});
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get<ApiResponse<Vendor>>(`/vendors/${id}`);
    return res.data.data;
  },

  getVendors: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<Vendor>>>('/vendors', { params });
    return res.data.data;
  },

  getVisits: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<VendorVisit>>>('/vendors/visits', { params });
    return res.data.data;
  },

  blacklist: async (id: number, reason: string) => {
    const res = await api.put<ApiResponse<Vendor>>(`/vendors/${id}/blacklist`, null, { params: { reason } });
    return res.data.data;
  },

  unblacklist: async (id: number, reason?: string) => {
    const res = await api.put<ApiResponse<Vendor>>(`/vendors/${id}/unblacklist`, null, { params: { reason } });
    return res.data.data;
  },
};

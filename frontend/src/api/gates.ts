import { api } from './axios';
import { ApiResponse, Gate } from '../types';

export const gateApi = {
  createGate: async (data: { name: string; location?: string; active?: boolean }) => {
    const res = await api.post<ApiResponse<Gate>>('/gates', data);
    return res.data.data;
  },

  updateGate: async (id: number, data: { name: string; location?: string; active?: boolean }) => {
    const res = await api.put<ApiResponse<Gate>>(`/gates/${id}`, data);
    return res.data.data;
  },

  getGateById: async (id: number) => {
    const res = await api.get<ApiResponse<Gate>>(`/gates/${id}`);
    return res.data.data;
  },

  getAllGates: async (activeOnly = false) => {
    try {
      const res = await api.get<ApiResponse<Gate[]>>('/gates', { params: { activeOnly } });
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        // Fallback gate list for Guard role without throwing 403
        return [
          { id: 1, name: 'Main Entrance Gate', active: true, createdAt: '' },
          { id: 2, name: 'Back Gate', active: true, createdAt: '' },
          { id: 3, name: 'Hostel Gate', active: true, createdAt: '' },
        ];
      }
      throw err;
    }
  },
};

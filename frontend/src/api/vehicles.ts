import { api } from './axios';
import { ApiResponse, PageResponse, Vehicle, VehicleLog } from '../types';

export const vehicleApi = {
  register: async (data: any) => {
    const res = await api.post<ApiResponse<Vehicle>>('/vehicles/register', data);
    return res.data.data;
  },

  recordEntry: async (vehicleId: number, data: any) => {
    const res = await api.post<ApiResponse<VehicleLog>>(`/vehicles/${vehicleId}/entry`, data);
    return res.data.data;
  },

  recordExit: async (logId: number, data?: any) => {
    const res = await api.put<ApiResponse<VehicleLog>>(`/vehicles/logs/${logId}/exit`, data || {});
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
    return res.data.data;
  },

  getByRegNumber: async (registrationNumber: string) => {
    const res = await api.get<ApiResponse<Vehicle>>(`/vehicles/registration/${registrationNumber}`);
    return res.data.data;
  },

  getVehicles: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<Vehicle>>>('/vehicles', { params });
    return res.data.data;
  },

  getVehicleLogs: async (params?: Record<string, any>) => {
    const res = await api.get<ApiResponse<PageResponse<VehicleLog>>>('/vehicles/logs', { params });
    return res.data.data;
  },

  blacklist: async (id: number, reason: string) => {
    const res = await api.put<ApiResponse<Vehicle>>(`/vehicles/${id}/blacklist`, null, { params: { reason } });
    return res.data.data;
  },

  unblacklist: async (id: number, reason?: string) => {
    const res = await api.put<ApiResponse<Vehicle>>(`/vehicles/${id}/unblacklist`, null, { params: { reason } });
    return res.data.data;
  },
};

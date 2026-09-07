import { api } from './axios';
import { ApiResponse, FacultyListItem, FacultyAvailability, FacultyAvailabilityStatus, HostDepartment } from '../types';

export const facultyApi = {
  getFacultyList: async (department?: HostDepartment, search?: string) => {
    const res = await api.get<ApiResponse<FacultyListItem[]>>('/faculty', {
      params: { department, search },
    });
    return res.data.data;
  },

  getAvailability: async (facultyId: number, date?: string) => {
    const res = await api.get<ApiResponse<FacultyAvailability>>(`/faculty/${facultyId}/availability`, {
      params: { date },
    });
    return res.data.data;
  },

  setAvailability: async (
    facultyId: number,
    data: { availabilityDate: string; status: FacultyAvailabilityStatus; note?: string }
  ) => {
    const res = await api.post<ApiResponse<FacultyAvailability>>(`/faculty/${facultyId}/availability`, data);
    return res.data.data;
  },

  getHistory: async (facultyId: number, startDate?: string, endDate?: string) => {
    const res = await api.get<ApiResponse<FacultyAvailability[]>>(`/faculty/${facultyId}/availability/history`, {
      params: { startDate, endDate },
    });
    return res.data.data;
  },
};

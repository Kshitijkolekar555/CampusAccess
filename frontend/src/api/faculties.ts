import { api } from './axios';
import { ApiResponse, Faculty, HostDepartment, PageResponse } from '../types';

export const facultyApi = {
  getAllFaculties: async (department?: HostDepartment): Promise<Faculty[]> => {
    const res = await api.get<ApiResponse<Faculty[]>>('/faculties', {
      params: department ? { department } : {},
    });
    return res.data.data;
  },

  searchFaculties: async (params?: {
    query?: string;
    department?: HostDepartment;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Faculty>> => {
    const res = await api.get<ApiResponse<PageResponse<Faculty>>>('/faculties/search', {
      params,
    });
    return res.data.data;
  },

  getFacultyById: async (id: number): Promise<Faculty> => {
    const res = await api.get<ApiResponse<Faculty>>(`/faculties/${id}`);
    return res.data.data;
  },
};

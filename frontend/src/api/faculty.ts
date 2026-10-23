import { api } from './axios';
import {
  ApiResponse,
  AuthResponse,
  FacultyOutpass,
  FacultyVerifyResponse,
  FacultyRegisterRequest,
  FacultyOutpassRequest,
} from '../types';

export const facultyApi = {
  verifyEmpNo: async (empNo: string): Promise<FacultyVerifyResponse> => {
    const res = await api.get<ApiResponse<FacultyVerifyResponse>>('/auth/faculty/verify-empno', {
      params: { empNo: empNo.trim() },
    });
    return res.data.data;
  },

  register: async (data: FacultyRegisterRequest): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/faculty/register', data);
    return res.data.data;
  },

  generateOutpass: async (data: FacultyOutpassRequest): Promise<FacultyOutpass> => {
    const res = await api.post<ApiResponse<FacultyOutpass>>('/faculty-outpasses', data);
    return res.data.data;
  },

  getMyActiveOutpass: async (): Promise<FacultyOutpass | null> => {
    const res = await api.get<ApiResponse<FacultyOutpass>>('/faculty-outpasses/my-active');
    return res.data.data;
  },

  getMyOutpassHistory: async (): Promise<FacultyOutpass[]> => {
    const res = await api.get<ApiResponse<FacultyOutpass[]>>('/faculty-outpasses/my-history');
    return res.data.data || [];
  },

  getActiveOutpassesForGuards: async (search?: string): Promise<FacultyOutpass[]> => {
    const res = await api.get<ApiResponse<FacultyOutpass[]>>('/faculty-outpasses/active', {
      params: search ? { search } : undefined,
    });
    return res.data.data || [];
  },

  getOutpassHistoryForGuards: async (search?: string): Promise<FacultyOutpass[]> => {
    const res = await api.get<ApiResponse<FacultyOutpass[]>>('/faculty-outpasses/history', {
      params: search ? { search } : undefined,
    });
    return res.data.data || [];
  },

  confirmFacultyReturn: async (
    outpassId: number,
    data?: { guardNotes?: string; gateId?: number }
  ): Promise<FacultyOutpass> => {
    const res = await api.put<ApiResponse<FacultyOutpass>>(
      `/faculty-outpasses/${outpassId}/confirm-return`,
      data || {}
    );
    return res.data.data;
  },
};

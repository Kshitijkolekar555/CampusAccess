import { api } from './axios';
import { ApiResponse, AuthResponse, StudentVerifyResponse, StudentRegisterRequest } from '../types';

export const studentApi = {
  verifyStudentId: async (studentId: string): Promise<StudentVerifyResponse> => {
    const res = await api.get<ApiResponse<StudentVerifyResponse>>('/auth/student/verify-id', {
      params: { studentId: studentId.trim() },
    });
    return res.data.data;
  },

  register: async (data: StudentRegisterRequest): Promise<AuthResponse> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/student/register', data);
    return res.data.data;
  },
};

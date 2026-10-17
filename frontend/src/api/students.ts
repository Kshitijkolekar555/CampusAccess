import { api } from './axios';
import { ApiResponse } from '../types';

export interface StudentVerificationData {
  identified: boolean;
  studentProfileId?: number;
  userId?: number;
  prn?: string;
  fullName?: string;
  rollNumber?: string;
  department?: string;
  academicYear?: string;
  division?: string;
  phone?: string;
  email?: string;
  faceId?: string;
  message?: string;
  gateAccessAuthorized: boolean;
  authorizationReason?: string;
  activeGatePassId?: number;
  gatePassStatus?: string;
  gatePassExpectedReturn?: string;
  activeOutpassId?: number;
  outpassStatus?: string;
  outpassExpectedReturn?: string;
}

export const studentApi = {
  verifyManual: async (query: string): Promise<StudentVerificationData> => {
    const res = await api.get<ApiResponse<StudentVerificationData>>('/students/verify-manual', {
      params: { query: query.trim() }
    });
    return res.data.data;
  },

  verifyFace: async (photoBlob: Blob): Promise<StudentVerificationData> => {
    const formData = new FormData();
    formData.append('photo', photoBlob, 'student_camera.jpg');
    const res = await api.post<ApiResponse<StudentVerificationData>>('/students/verify-face', formData);
    return res.data.data;
  }
};
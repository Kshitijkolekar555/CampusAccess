import { api } from './axios';
import {
  ApiResponse,
  PageResponse,
  VisitorMeetingRequest,
  PurposeType,
  HostDepartment,
} from '../types';

export const meetingRequestsApi = {
  createRequest: async (data: {
    visitorId: number;
    purposeType: PurposeType;
    department?: HostDepartment;
    facultyId?: number;
    gateId: number;
  }) => {
    const res = await api.post<ApiResponse<VisitorMeetingRequest>>('/meeting-requests', data);
    return res.data.data;
  },

  getPendingForFaculty: async (params?: { page?: number; size?: number }) => {
    const res = await api.get<ApiResponse<PageResponse<VisitorMeetingRequest>>>('/meeting-requests/faculty/pending', {
      params,
    });
    return res.data.data;
  },

  getAllForFaculty: async (params?: { page?: number; size?: number }) => {
    const res = await api.get<ApiResponse<PageResponse<VisitorMeetingRequest>>>('/meeting-requests/faculty/all', {
      params,
    });
    return res.data.data;
  },

  approve: async (
    id: number,
    data: {
      meetingLocation: string;
      building?: string;
      floor?: string;
      roomNumber?: string;
      notes?: string;
    }
  ) => {
    const res = await api.post<ApiResponse<VisitorMeetingRequest>>(`/meeting-requests/${id}/approve`, data);
    return res.data.data;
  },

  reject: async (id: number, data: { reason: string }) => {
    const res = await api.post<ApiResponse<VisitorMeetingRequest>>(`/meeting-requests/${id}/reject`, data);
    return res.data.data;
  },

  reschedule: async (
    id: number,
    data: {
      suggestedDate: string;
      suggestedTime: string;
      reason: string;
    }
  ) => {
    const res = await api.post<ApiResponse<VisitorMeetingRequest>>(`/meeting-requests/${id}/reschedule`, data);
    return res.data.data;
  },

  getRequestsByGate: async (gateId: number, params?: { page?: number; size?: number }) => {
    const res = await api.get<ApiResponse<PageResponse<VisitorMeetingRequest>>>(`/meeting-requests/gate/${gateId}`, {
      params,
    });
    return res.data.data;
  },

  lookupByMobile: async (mobile: string) => {
    const res = await api.get<ApiResponse<VisitorMeetingRequest[]>>('/meeting-requests/lookup', {
      params: { mobile },
    });
    return res.data.data;
  },

  getById: async (id: number) => {
    const res = await api.get<ApiResponse<VisitorMeetingRequest>>(`/meeting-requests/${id}`);
    return res.data.data;
  },

  getByVisitorId: async (visitorId: number) => {
    const res = await api.get<ApiResponse<VisitorMeetingRequest[]>>(`/meeting-requests/visitor/${visitorId}`);
    return res.data.data;
  },
};

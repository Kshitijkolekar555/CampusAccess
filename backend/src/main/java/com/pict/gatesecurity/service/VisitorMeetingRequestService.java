package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.meeting.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface VisitorMeetingRequestService {

    VisitorMeetingRequestResponse createRequest(VisitorMeetingRequestCreateRequest request, String performingUsername);

    VisitorMeetingRequestResponse approveMeeting(Long requestId, MeetingApprovalRequest request, String facultyUsername);

    VisitorMeetingRequestResponse rejectMeeting(Long requestId, MeetingRejectionRequest request, String facultyUsername);

    VisitorMeetingRequestResponse rescheduleMeeting(Long requestId, MeetingRescheduleRequest request, String facultyUsername);

    Page<VisitorMeetingRequestResponse> getPendingRequestsForFaculty(String facultyUsername, Pageable pageable);

    Page<VisitorMeetingRequestResponse> getAllRequestsForFaculty(String facultyUsername, Pageable pageable);

    List<VisitorMeetingRequestResponse> getRequestsByVisitorId(Long visitorId);

    List<VisitorMeetingRequestResponse> lookupByMobile(String mobile);

    VisitorMeetingRequestResponse getRequestById(Long requestId);

    Page<VisitorMeetingRequestResponse> getRequestsByGate(Long gateId, Pageable pageable);

    Page<VisitorMeetingRequestResponse> getAllRequests(Pageable pageable);
}

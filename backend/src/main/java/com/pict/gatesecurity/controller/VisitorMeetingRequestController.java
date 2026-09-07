package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.meeting.*;
import com.pict.gatesecurity.service.VisitorMeetingRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/meeting-requests", "/api/meeting-requests"})
@RequiredArgsConstructor
@Tag(name = "Meeting Requests", description = "Visitor-Faculty meeting request lifecycle, approvals, and security gate monitoring")
public class VisitorMeetingRequestController {

    private final VisitorMeetingRequestService meetingRequestService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF', 'USER')")
    @Operation(summary = "Create Meeting Request", description = "Creates a new meeting request when visitor checks in")
    public ResponseEntity<ApiResponse<VisitorMeetingRequestResponse>> createRequest(
            @Valid @RequestBody VisitorMeetingRequestCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = (userDetails != null) ? userDetails.getUsername() : "system";
        VisitorMeetingRequestResponse response = meetingRequestService.createRequest(request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Meeting request created successfully"));
    }

    @GetMapping("/faculty/pending")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Get Pending Faculty Requests", description = "Fetches pending meeting requests awaiting approval from logged-in faculty")
    public ResponseEntity<ApiResponse<PageResponse<VisitorMeetingRequestResponse>>> getPendingFacultyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestTime").descending());
        Page<VisitorMeetingRequestResponse> result = meetingRequestService.getPendingRequestsForFaculty(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/faculty/all")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Get All Faculty Requests", description = "Fetches all meeting requests (past & present) for logged-in faculty")
    public ResponseEntity<ApiResponse<PageResponse<VisitorMeetingRequestResponse>>> getAllFacultyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestTime").descending());
        Page<VisitorMeetingRequestResponse> result = meetingRequestService.getAllRequestsForFaculty(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Approve Meeting Request", description = "Faculty approves request and provides meeting location details")
    public ResponseEntity<ApiResponse<VisitorMeetingRequestResponse>> approveMeeting(
            @PathVariable Long id,
            @Valid @RequestBody MeetingApprovalRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorMeetingRequestResponse response = meetingRequestService.approveMeeting(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Meeting request approved"));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Reject Meeting Request", description = "Faculty rejects request with a reason")
    public ResponseEntity<ApiResponse<VisitorMeetingRequestResponse>> rejectMeeting(
            @PathVariable Long id,
            @Valid @RequestBody MeetingRejectionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorMeetingRequestResponse response = meetingRequestService.rejectMeeting(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Meeting request rejected"));
    }

    @PostMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Reschedule Meeting Request", description = "Faculty proposes new date, time and reason")
    public ResponseEntity<ApiResponse<VisitorMeetingRequestResponse>> rescheduleMeeting(
            @PathVariable Long id,
            @Valid @RequestBody MeetingRescheduleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorMeetingRequestResponse response = meetingRequestService.rescheduleMeeting(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Meeting request rescheduled"));
    }

    @GetMapping("/gate/{gateId}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Monitor Gate Meeting Requests", description = "Read-only endpoint for security guards at the main gate to monitor meeting request statuses")
    public ResponseEntity<ApiResponse<PageResponse<VisitorMeetingRequestResponse>>> getGateRequests(
            @PathVariable Long gateId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestTime").descending());
        Page<VisitorMeetingRequestResponse> result = meetingRequestService.getRequestsByGate(gateId, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/lookup")
    @Operation(summary = "Public Visitor Status Lookup", description = "Allows visitors to track their meeting status using mobile number without authentication")
    public ResponseEntity<ApiResponse<List<VisitorMeetingRequestResponse>>> lookupByMobile(
            @RequestParam String mobile) {
        List<VisitorMeetingRequestResponse> list = meetingRequestService.lookupByMobile(mobile);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/visitor/{visitorId}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF', 'FACULTY')")
    @Operation(summary = "Get Requests by Visitor ID", description = "Fetches all meeting requests for a specific visitor ID")
    public ResponseEntity<ApiResponse<List<VisitorMeetingRequestResponse>>> getByVisitorId(@PathVariable Long visitorId) {
        List<VisitorMeetingRequestResponse> list = meetingRequestService.getRequestsByVisitorId(visitorId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF', 'FACULTY')")
    @Operation(summary = "Get Meeting Request by ID", description = "Fetches full details of a meeting request by ID")
    public ResponseEntity<ApiResponse<VisitorMeetingRequestResponse>> getById(@PathVariable Long id) {
        VisitorMeetingRequestResponse response = meetingRequestService.getRequestById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER')")
    @Operation(summary = "List All Meeting Requests", description = "Admin overview of all meeting requests across all gates")
    public ResponseEntity<ApiResponse<PageResponse<VisitorMeetingRequestResponse>>> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("requestTime").descending());
        Page<VisitorMeetingRequestResponse> result = meetingRequestService.getAllRequests(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }
}

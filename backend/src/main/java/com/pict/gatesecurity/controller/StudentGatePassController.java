package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.studentpass.*;
import com.pict.gatesecurity.entity.enums.PassStatus;
import com.pict.gatesecurity.service.StudentGatePassService;
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

@RestController
@RequestMapping("/api/v1/student-passes")
@RequiredArgsConstructor
@Tag(name = "Student Gate Pass Management", description = "Student Gate Pass requests, warden approval, and gate exit/entry logging")
public class StudentGatePassController {

    private final StudentGatePassService studentGatePassService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN', 'HOSTEL_WARDEN')")
    @Operation(summary = "Create Gate Pass", description = "Creates a new student gate pass request")
    public ResponseEntity<ApiResponse<StudentGatePassResponse>> createPass(
            @Valid @RequestBody StudentGatePassRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentGatePassResponse response = studentGatePassService.createPass(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Gate pass created successfully"));
    }

    @PutMapping("/{passId}/approve")
    @PreAuthorize("hasAnyRole('HOSTEL_WARDEN', 'ADMIN')")
    @Operation(summary = "Approve or Reject Gate Pass", description = "Warden or Admin approves/rejects a pending gate pass")
    public ResponseEntity<ApiResponse<StudentGatePassResponse>> approvePass(
            @PathVariable Long passId,
            @Valid @RequestBody StudentGatePassApprovalRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentGatePassResponse response = studentGatePassService.approvePass(passId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, request.isApproved() ? "Gate pass approved" : "Gate pass rejected"));
    }

    @PutMapping("/{passId}/exit/{gateId}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Record Gate Exit", description = "Records student exit through the gate using an approved pass")
    public ResponseEntity<ApiResponse<StudentGatePassResponse>> recordGateExit(
            @PathVariable Long passId,
            @PathVariable Long gateId,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentGatePassResponse response = studentGatePassService.recordGateExit(passId, gateId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Gate exit recorded"));
    }

    @PutMapping("/{passId}/entry")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Record Gate Entry", description = "Records student re-entry through the gate")
    public ResponseEntity<ApiResponse<StudentGatePassResponse>> recordGateEntry(
            @PathVariable Long passId,
            @AuthenticationPrincipal UserDetails userDetails) {
        StudentGatePassResponse response = studentGatePassService.recordGateEntry(passId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Gate entry recorded"));
    }

    @GetMapping("/{passId}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN', 'HOSTEL_WARDEN')")
    @Operation(summary = "Get Gate Pass by ID", description = "Fetches gate pass details by ID")
    public ResponseEntity<ApiResponse<StudentGatePassResponse>> getPassById(@PathVariable Long passId) {
        StudentGatePassResponse response = studentGatePassService.getPassById(passId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN', 'HOSTEL_WARDEN')")
    @Operation(summary = "Search & Filter Gate Passes", description = "Paginated list of gate passes filtered by query, PRN, or status")
    public ResponseEntity<ApiResponse<PageResponse<StudentGatePassResponse>>> getPasses(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String studentPrn,
            @RequestParam(required = false) PassStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<StudentGatePassResponse> passPage = studentGatePassService.getPasses(query, studentPrn, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(passPage)));
    }
}

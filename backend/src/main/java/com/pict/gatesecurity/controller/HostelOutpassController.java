package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.outpass.*;
import com.pict.gatesecurity.entity.enums.OutpassStatus;
import com.pict.gatesecurity.service.HostelOutpassService;
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
@RequestMapping("/api/v1/hostel-outpasses")
@RequiredArgsConstructor
@Tag(name = "Hostel Outpass Management", description = "Hostel outpass requests, warden approval, and gate exit/entry logging")
public class HostelOutpassController {

    private final HostelOutpassService hostelOutpassService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN', 'HOSTEL_WARDEN')")
    @Operation(summary = "Create Outpass", description = "Creates a new hostel outpass request")
    public ResponseEntity<ApiResponse<HostelOutpassResponse>> createOutpass(
            @Valid @RequestBody HostelOutpassRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        HostelOutpassResponse response = hostelOutpassService.createOutpass(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Outpass created successfully"));
    }

    @PutMapping("/{outpassId}/approve")
    @PreAuthorize("hasAnyRole('HOSTEL_WARDEN', 'ADMIN')")
    @Operation(summary = "Approve or Reject Outpass", description = "Warden or Admin approves/rejects a pending outpass")
    public ResponseEntity<ApiResponse<HostelOutpassResponse>> approveOutpass(
            @PathVariable Long outpassId,
            @Valid @RequestBody HostelOutpassApprovalRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        HostelOutpassResponse response = hostelOutpassService.approveOutpass(outpassId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, request.isApproved() ? "Outpass approved" : "Outpass rejected"));
    }

    @PutMapping("/{outpassId}/exit/{gateId}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Record Gate Exit", description = "Records student exit through the gate using an approved outpass")
    public ResponseEntity<ApiResponse<HostelOutpassResponse>> recordGateExit(
            @PathVariable Long outpassId,
            @PathVariable Long gateId,
            @AuthenticationPrincipal UserDetails userDetails) {
        HostelOutpassResponse response = hostelOutpassService.recordGateExit(outpassId, gateId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Gate exit recorded"));
    }

    @PutMapping("/{outpassId}/entry")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Record Gate Entry", description = "Records student re-entry through the gate")
    public ResponseEntity<ApiResponse<HostelOutpassResponse>> recordGateEntry(
            @PathVariable Long outpassId,
            @AuthenticationPrincipal UserDetails userDetails) {
        HostelOutpassResponse response = hostelOutpassService.recordGateEntry(outpassId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Gate entry recorded"));
    }

    @GetMapping("/{outpassId}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN', 'HOSTEL_WARDEN')")
    @Operation(summary = "Get Outpass by ID", description = "Fetches outpass details by ID")
    public ResponseEntity<ApiResponse<HostelOutpassResponse>> getOutpassById(@PathVariable Long outpassId) {
        HostelOutpassResponse response = hostelOutpassService.getOutpassById(outpassId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN', 'HOSTEL_WARDEN')")
    @Operation(summary = "Search & Filter Outpasses", description = "Paginated list of outpasses filtered by query, PRN, status, or late return")
    public ResponseEntity<ApiResponse<PageResponse<HostelOutpassResponse>>> getOutpasses(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String studentPrn,
            @RequestParam(required = false) OutpassStatus status,
            @RequestParam(required = false) Boolean isLateReturn,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<HostelOutpassResponse> outpassPage = hostelOutpassService.getOutpasses(query, studentPrn, status, isLateReturn, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(outpassPage)));
    }
}

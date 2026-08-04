package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.staff.StaffBreakResponse;
import com.pict.gatesecurity.service.StaffBreakService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff/breaks")
@RequiredArgsConstructor
@Tag(name = "Staff Break Management", description = "Endpoints for staff members to manage their break sessions")
public class StaffBreakController {

    private final StaffBreakService staffBreakService;

    @PostMapping("/start")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Start Break", description = "Starts a new break session for the authenticated staff member")
    public ResponseEntity<ApiResponse<StaffBreakResponse>> startBreak(
            @RequestParam(required = false) String note,
            @AuthenticationPrincipal UserDetails userDetails) {
        StaffBreakResponse response = staffBreakService.startBreak(userDetails.getUsername(), note);
        return ResponseEntity.ok(ApiResponse.success(response, "Break started successfully"));
    }

    @PostMapping("/end")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "End Break", description = "Ends the active break session for the authenticated staff member")
    public ResponseEntity<ApiResponse<StaffBreakResponse>> endBreak(
            @RequestParam(required = false) String note,
            @AuthenticationPrincipal UserDetails userDetails) {
        StaffBreakResponse response = staffBreakService.endBreak(userDetails.getUsername(), note);
        return ResponseEntity.ok(ApiResponse.success(response, "Break ended successfully"));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Get Active Break", description = "Returns active break details if currently on break")
    public ResponseEntity<ApiResponse<StaffBreakResponse>> getActiveBreak(
            @AuthenticationPrincipal UserDetails userDetails) {
        StaffBreakResponse response = staffBreakService.getActiveBreak(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    @Operation(summary = "Get Break History", description = "Returns paginated history of breaks for authenticated staff member")
    public ResponseEntity<ApiResponse<PageResponse<StaffBreakResponse>>> getMyBreakHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size);
        Page<StaffBreakResponse> historyPage = staffBreakService.getMyBreakHistory(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(historyPage)));
    }
}

package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.visitor.VisitorCheckInRequest;
import com.pict.gatesecurity.dto.visitor.VisitorCheckOutRequest;
import com.pict.gatesecurity.dto.visitor.VisitorResponse;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import com.pict.gatesecurity.service.VisitorService;
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
@RequestMapping("/api/v1/visitors")
@RequiredArgsConstructor
@Tag(name = "Visitor Management", description = "Visitor Check-In, QR Pass Generation, Check-Out, and Active Visitor Tracking")
public class VisitorController {

    private final VisitorService visitorService;

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Visitor Check-In", description = "Registers visitor, checks watchlist, and generates QR digital pass")
    public ResponseEntity<ApiResponse<VisitorResponse>> checkIn(
            @Valid @RequestBody VisitorCheckInRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorResponse response = visitorService.checkIn(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Visitor checked in successfully"));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Visitor Check-Out", description = "Logs visitor checkout by visitor ID, pass code, or mobile number")
    public ResponseEntity<ApiResponse<VisitorResponse>> checkOut(
            @RequestBody VisitorCheckOutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorResponse response = visitorService.checkOut(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Visitor checked out successfully"));
    }

    @GetMapping("/inside")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Active Visitors Inside", description = "Returns a list of all visitors currently on campus (not yet checked out)")
    public ResponseEntity<ApiResponse<List<VisitorResponse>>> getActiveVisitorsInside() {
        List<VisitorResponse> responses = visitorService.getActiveVisitorsInside();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get Visitor Details", description = "Fetches visitor record and QR pass details by ID")
    public ResponseEntity<ApiResponse<VisitorResponse>> getVisitorById(@PathVariable Long id) {
        VisitorResponse response = visitorService.getVisitorById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search & Filter Visitor Logs", description = "Paginated list of visitors filtered by search query, department, host type, or blacklist status")
    public ResponseEntity<ApiResponse<PageResponse<VisitorResponse>>> getVisitors(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) HostDepartment department,
            @RequestParam(required = false) HostType hostType,
            @RequestParam(required = false) Boolean isBlacklisted,
            @RequestParam(required = false) Boolean activeInside,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timeIn") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<VisitorResponse> visitorPage = visitorService.getVisitors(query, department, hostType, isBlacklisted, activeInside, pageable, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(visitorPage)));
    }
}

package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.faculty.FacultyAvailabilityRequest;
import com.pict.gatesecurity.dto.faculty.FacultyAvailabilityResponse;
import com.pict.gatesecurity.dto.faculty.FacultyListResponse;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.service.FacultyAvailabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/faculty", "/api/faculty"})
@RequiredArgsConstructor
@Tag(name = "Faculty Management", description = "Faculty availability, directory lookup, and schedule management")
public class FacultyAvailabilityController {

    private final FacultyAvailabilityService facultyAvailabilityService;

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "List Faculty", description = "Returns active faculty members with today's availability status, filterable by department and search query")
    public ResponseEntity<ApiResponse<List<FacultyListResponse>>> getFacultyList(
            @RequestParam(required = false) HostDepartment department,
            @RequestParam(required = false) String search) {
        List<FacultyListResponse> list = facultyAvailabilityService.getFacultyList(department, search);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF', 'FACULTY')")
    @Operation(summary = "Get Faculty Availability", description = "Fetches availability status and note for a given date")
    public ResponseEntity<ApiResponse<FacultyAvailabilityResponse>> getAvailability(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate queryDate = (date != null) ? date : LocalDate.now();
        FacultyAvailabilityResponse response = facultyAvailabilityService.getAvailabilityForDate(id, queryDate);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Set Faculty Availability", description = "Updates or sets availability for a date (Available, Busy, Leave, Out of Campus)")
    public ResponseEntity<ApiResponse<FacultyAvailabilityResponse>> setAvailability(
            @PathVariable Long id,
            @Valid @RequestBody FacultyAvailabilityRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        FacultyAvailabilityResponse response = facultyAvailabilityService.setAvailability(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Availability updated successfully"));
    }

    @GetMapping("/{id}/availability/history")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    @Operation(summary = "Get Availability History", description = "Fetches availability audit trail for a faculty member")
    public ResponseEntity<ApiResponse<List<FacultyAvailabilityResponse>>> getHistory(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<FacultyAvailabilityResponse> history = facultyAvailabilityService.getAvailabilityHistory(id, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}

package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.faculty.FacultyOutpassRequest;
import com.pict.gatesecurity.dto.faculty.FacultyOutpassResponse;
import com.pict.gatesecurity.dto.faculty.FacultyReturnConfirmRequest;
import com.pict.gatesecurity.service.FacultyOutpassService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty-outpasses")
@RequiredArgsConstructor
@Tag(name = "Faculty Outpass Management", description = "Independent outpass generation and guard re-entry confirmation")
public class FacultyOutpassController {

    private final FacultyOutpassService facultyOutpassService;

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY', 'STAFF', 'ADMIN')")
    @Operation(summary = "Generate Faculty Out-Pass", description = "Generates an outpass immediately without approval")
    public ResponseEntity<ApiResponse<FacultyOutpassResponse>> generateOutpass(
            @Valid @RequestBody FacultyOutpassRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        FacultyOutpassResponse response = facultyOutpassService.generateOutpass(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Out-pass generated successfully"));
    }

    @GetMapping("/my-active")
    @PreAuthorize("hasAnyRole('FACULTY', 'STAFF', 'ADMIN')")
    @Operation(summary = "Get Current Active Out-Pass", description = "Retrieves current active outpass for authenticated faculty")
    public ResponseEntity<ApiResponse<FacultyOutpassResponse>> getMyActiveOutpass(
            @AuthenticationPrincipal UserDetails userDetails) {
        FacultyOutpassResponse response = facultyOutpassService.getMyActiveOutpass(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, response != null ? "Active outpass found" : "No active outpass"));
    }

    @GetMapping("/my-history")
    @PreAuthorize("hasAnyRole('FACULTY', 'STAFF', 'ADMIN')")
    @Operation(summary = "Get Faculty Out-Pass History", description = "Retrieves outpass history for authenticated faculty")
    public ResponseEntity<ApiResponse<List<FacultyOutpassResponse>>> getMyOutpassHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<FacultyOutpassResponse> response = facultyOutpassService.getMyOutpassHistory(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Outpass history retrieved successfully"));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Get Active Faculty Out-Passes (Guard)", description = "Retrieves all currently active faculty outpasses for guard dashboard")
    public ResponseEntity<ApiResponse<List<FacultyOutpassResponse>>> getActiveOutpassesForGuards(
            @RequestParam(required = false) String search) {
        List<FacultyOutpassResponse> response = facultyOutpassService.getActiveOutpassesForGuards(search);
        return ResponseEntity.ok(ApiResponse.success(response, "Active faculty outpasses retrieved"));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Get Faculty Out-Pass History (Guard)", description = "Retrieves all historical faculty outpasses for guards")
    public ResponseEntity<ApiResponse<List<FacultyOutpassResponse>>> getOutpassHistoryForGuards(
            @RequestParam(required = false) String search) {
        List<FacultyOutpassResponse> response = facultyOutpassService.getOutpassHistoryForGuards(search);
        return ResponseEntity.ok(ApiResponse.success(response, "Faculty outpass history retrieved"));
    }

    @PutMapping("/{id}/confirm-return")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Confirm Faculty Re-Entry", description = "Guard confirms faculty member's physical return to campus")
    public ResponseEntity<ApiResponse<FacultyOutpassResponse>> confirmFacultyReturn(
            @PathVariable Long id,
            @RequestBody(required = false) FacultyReturnConfirmRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        FacultyOutpassResponse response = facultyOutpassService.confirmFacultyReturn(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Faculty re-entry confirmed successfully"));
    }
}

package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.faculty.FacultyResponse;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.service.FacultyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculties")
@RequiredArgsConstructor
@Tag(name = "Faculty Directory", description = "Public and Authenticated Faculty Contact Directory APIs")
public class FacultyController {

    private final FacultyService facultyService;

    @GetMapping
    @Operation(summary = "Get All Faculties", description = "Retrieves all active faculty members, optionally filtered by department (Publicly accessible for visitors/guards)")
    public ResponseEntity<ApiResponse<List<FacultyResponse>>> getAllFaculties(
            @RequestParam(required = false) HostDepartment department) {
        List<FacultyResponse> list = facultyService.getAllFaculties(department);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/search")
    @Operation(summary = "Search Faculty Directory", description = "Search faculty by name, email, or phone with pagination and department filtering")
    public ResponseEntity<ApiResponse<PageResponse<FacultyResponse>>> searchFaculties(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) HostDepartment department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("DESC") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FacultyResponse> result = facultyService.searchFaculties(query, department, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Faculty Details", description = "Retrieves details of a specific faculty member by ID")
    public ResponseEntity<ApiResponse<FacultyResponse>> getFacultyById(@PathVariable Long id) {
        FacultyResponse response = facultyService.getFacultyById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

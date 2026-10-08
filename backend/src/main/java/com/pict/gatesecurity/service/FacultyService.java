package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.faculty.FacultyResponse;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface FacultyService {
    List<FacultyResponse> getAllFaculties(HostDepartment department);
    Page<FacultyResponse> searchFaculties(String query, HostDepartment department, Pageable pageable);
    FacultyResponse getFacultyById(Long id);
    void seedFacultiesFromJson();
}

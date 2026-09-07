package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.faculty.FacultyAvailabilityRequest;
import com.pict.gatesecurity.dto.faculty.FacultyAvailabilityResponse;
import com.pict.gatesecurity.dto.faculty.FacultyListResponse;
import com.pict.gatesecurity.entity.enums.FacultyAvailabilityStatus;
import com.pict.gatesecurity.entity.enums.HostDepartment;

import java.time.LocalDate;
import java.util.List;

public interface FacultyAvailabilityService {

    FacultyAvailabilityResponse setAvailability(Long facultyId, FacultyAvailabilityRequest request, String actorUsername);

    FacultyAvailabilityResponse getAvailabilityForDate(Long facultyId, LocalDate date);

    List<FacultyAvailabilityResponse> getAvailabilityHistory(Long facultyId, LocalDate startDate, LocalDate endDate);

    List<FacultyListResponse> getFacultyList(HostDepartment department, String search);

    FacultyAvailabilityStatus checkAvailabilityStatus(Long facultyId, LocalDate date);
}

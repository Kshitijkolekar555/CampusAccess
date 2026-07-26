package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.visitor.VisitorCheckInRequest;
import com.pict.gatesecurity.dto.visitor.VisitorCheckOutRequest;
import com.pict.gatesecurity.dto.visitor.VisitorResponse;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface VisitorService {
    VisitorResponse checkIn(VisitorCheckInRequest request, String performingUsername);
    VisitorResponse checkOut(VisitorCheckOutRequest request, String performingUsername);
    VisitorResponse getVisitorById(Long id);
    List<VisitorResponse> getActiveVisitorsInside();
    Page<VisitorResponse> getVisitors(String query, HostDepartment department, HostType hostType, Boolean isBlacklisted, Boolean activeInside, Pageable pageable);
}

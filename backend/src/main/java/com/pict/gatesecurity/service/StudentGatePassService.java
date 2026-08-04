package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.studentpass.*;
import com.pict.gatesecurity.entity.enums.PassStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StudentGatePassService {

    StudentGatePassResponse createPass(StudentGatePassRequest request, String performingUsername);

    StudentGatePassResponse approvePass(Long passId, StudentGatePassApprovalRequest request, String performingUsername);

    StudentGatePassResponse recordGateExit(Long passId, Long gateId, String performingUsername);

    StudentGatePassResponse recordGateEntry(Long passId, String performingUsername);

    StudentGatePassResponse getPassById(Long passId, String performingUsername);

    Page<StudentGatePassResponse> getPasses(String query, String studentPrn, PassStatus status, Pageable pageable, String performingUsername);
}

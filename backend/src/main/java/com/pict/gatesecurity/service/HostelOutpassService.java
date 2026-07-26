package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.outpass.*;
import com.pict.gatesecurity.entity.enums.OutpassStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface HostelOutpassService {

    HostelOutpassResponse createOutpass(HostelOutpassRequest request, String performingUsername);

    HostelOutpassResponse approveOutpass(Long outpassId, HostelOutpassApprovalRequest request, String performingUsername);

    HostelOutpassResponse recordGateExit(Long outpassId, Long gateId, String performingUsername);

    HostelOutpassResponse recordGateEntry(Long outpassId, String performingUsername);

    HostelOutpassResponse getOutpassById(Long outpassId);

    Page<HostelOutpassResponse> getOutpasses(String query, String studentPrn, OutpassStatus status, Boolean isLateReturn, Pageable pageable);
}

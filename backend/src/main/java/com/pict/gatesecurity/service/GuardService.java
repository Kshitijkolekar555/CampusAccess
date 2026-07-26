package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.guard.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GuardService {
    GuardResponse createGuard(GuardCreateRequest request, String performingUsername);
    GuardResponse updateGuard(Long id, GuardUpdateRequest request, String performingUsername);
    GuardResponse getGuardById(Long id);
    Page<GuardResponse> getGuards(Boolean activeOnly, Pageable pageable);
    ShiftResponse startShift(ShiftStartRequest request, String performingUsername);
    ShiftResponse endShift(String performingUsername);
    ShiftResponse getCurrentShift(String performingUsername);
    ShiftLogResponse addShiftLog(Long shiftId, ShiftLogCreateRequest request, String performingUsername);
    Page<ShiftLogResponse> getShiftLogs(Long shiftId, Pageable pageable);
    GuardDashboardResponse getGuardDashboard();
}

package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.staff.StaffBreakResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface StaffBreakService {

    StaffBreakResponse startBreak(String username, String note);

    StaffBreakResponse endBreak(String username, String note);

    StaffBreakResponse getActiveBreak(String username);

    Page<StaffBreakResponse> getMyBreakHistory(String username, Pageable pageable);
}

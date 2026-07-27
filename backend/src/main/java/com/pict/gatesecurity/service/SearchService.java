package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.search.SearchFilterRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface SearchService {

    Page<Object> searchVisitors(SearchFilterRequest filter, Pageable pageable);

    Page<Object> searchVehicles(SearchFilterRequest filter, Pageable pageable);

    Page<Object> searchStudentGatePasses(SearchFilterRequest filter, Pageable pageable);

    Page<Object> searchHostelOutpasses(SearchFilterRequest filter, Pageable pageable);

    Page<Object> searchGuards(SearchFilterRequest filter, Pageable pageable);

    Page<Object> searchVendors(SearchFilterRequest filter, Pageable pageable);

    Page<Object> searchNotifications(SearchFilterRequest filter, Pageable pageable);

    Page<Object> searchAuditLogs(SearchFilterRequest filter, Pageable pageable);

    Page<Object> searchShifts(SearchFilterRequest filter, Pageable pageable);

    // DTO projection variants
    Page<?> searchVisitorsAsProjection(SearchFilterRequest filter, Pageable pageable);
    Page<?> searchVehiclesAsProjection(SearchFilterRequest filter, Pageable pageable);
    Page<?> searchStudentGatePassesAsProjection(SearchFilterRequest filter, Pageable pageable);
    Page<?> searchHostelOutpassesAsProjection(SearchFilterRequest filter, Pageable pageable);
    Page<?> searchGuardsAsProjection(SearchFilterRequest filter, Pageable pageable);
    Page<?> searchVendorsAsProjection(SearchFilterRequest filter, Pageable pageable);
    Page<?> searchNotificationsAsProjection(SearchFilterRequest filter, Pageable pageable);
    Page<?> searchAuditLogsAsProjection(SearchFilterRequest filter, Pageable pageable);
}

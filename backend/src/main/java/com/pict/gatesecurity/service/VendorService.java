package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.vendor.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface VendorService {

    VendorResponse registerVendor(VendorRegisterRequest request, String performingUsername);

    VendorVisitResponse recordEntry(Long vendorId, VendorVisitEntryRequest request, String performingUsername);

    VendorVisitResponse recordExit(Long visitId, VendorVisitExitRequest request, String performingUsername);

    VendorResponse getVendorById(Long id);

    Page<VendorResponse> getVendors(String query, Boolean isBlacklisted, Pageable pageable);

    Page<VendorVisitResponse> getVisits(Long vendorId, Long gateId, Boolean isInside, Pageable pageable);

    VendorResponse blacklistVendor(Long id, String reason, String performingUsername);

    VendorResponse unblacklistVendor(Long id, String reason, String performingUsername);
}

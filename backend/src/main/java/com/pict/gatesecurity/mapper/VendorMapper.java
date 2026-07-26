package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.vendor.VendorResponse;
import com.pict.gatesecurity.dto.vendor.VendorVisitResponse;
import com.pict.gatesecurity.entity.Vendor;
import com.pict.gatesecurity.entity.VendorVisit;
import org.springframework.stereotype.Component;

@Component
public class VendorMapper {

    public VendorResponse toResponse(Vendor vendor) {
        if (vendor == null) return null;
        return VendorResponse.builder()
                .id(vendor.getId())
                .companyName(vendor.getCompanyName())
                .contactPerson(vendor.getContactPerson())
                .contactPhone(vendor.getContactPhone())
                .contactEmail(vendor.getContactEmail())
                .workDescription(vendor.getWorkDescription())
                .assignedDepartment(vendor.getAssignedDepartment())
                .isBlacklisted(vendor.getIsBlacklisted())
                .blacklistReason(vendor.getBlacklistReason())
                .createdAt(vendor.getCreatedAt())
                .createdByUsername(vendor.getCreatedBy() != null ? vendor.getCreatedBy().getUsername() : null)
                .build();
    }

    public VendorVisitResponse toVisitResponse(VendorVisit visit) {
        if (visit == null) return null;
        return VendorVisitResponse.builder()
                .id(visit.getId())
                .vendorId(visit.getVendor().getId())
                .companyName(visit.getVendor().getCompanyName())
                .contactPerson(visit.getVendor().getContactPerson())
                .contactPhone(visit.getVendor().getContactPhone())
                .gateId(visit.getGate().getId())
                .gateName(visit.getGate().getName())
                .entryTime(visit.getEntryTime())
                .exitTime(visit.getExitTime())
                .purpose(visit.getPurpose())
                .entryNote(visit.getEntryNote())
                .exitNote(visit.getExitNote())
                .createdAt(visit.getCreatedAt())
                .createdByUsername(visit.getCreatedBy() != null ? visit.getCreatedBy().getUsername() : null)
                .build();
    }
}

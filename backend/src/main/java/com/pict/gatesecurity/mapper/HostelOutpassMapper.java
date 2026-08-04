package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.outpass.HostelOutpassResponse;
import com.pict.gatesecurity.entity.HostelOutpass;
import org.springframework.stereotype.Component;

@Component
public class HostelOutpassMapper {

    public HostelOutpassResponse toResponse(HostelOutpass outpass) {
        if (outpass == null) {
            return null;
        }

        return HostelOutpassResponse.builder()
                .id(outpass.getId())
                .studentUserId(outpass.getStudentUser() != null ? outpass.getStudentUser().getId() : null)
                .studentUsername(outpass.getStudentUser() != null ? outpass.getStudentUser().getUsername() : null)
                .studentName(outpass.getStudentName())
                .studentPrn(outpass.getStudentPrn())
                .studentMobile(outpass.getStudentMobile())
                .studentRoom(outpass.getStudentRoom())
                .studentHostel(outpass.getStudentHostel())
                .studentClass(outpass.getStudentClass())
                .studentDivision(outpass.getStudentDivision())
                .reason(outpass.getReason())
                .studentNote(outpass.getStudentNote())
                .destination(outpass.getDestination())
                .departureTime(outpass.getDepartureTime())
                .expectedReturnTime(outpass.getExpectedReturnTime())
                .actualReturnTime(outpass.getActualReturnTime())
                .parentContact(outpass.getParentContact())
                .emergencyContact(outpass.getEmergencyContact())
                .status(outpass.getStatus())
                .wardenId(outpass.getWarden() != null ? outpass.getWarden().getId() : null)
                .wardenUsername(outpass.getWarden() != null ? outpass.getWarden().getUsername() : null)
                .wardenRemarks(outpass.getWardenRemarks())
                .rejectionReason(outpass.getRejectionReason())
                .wardenActedAt(outpass.getWardenActedAt())
                .gateExitAt(outpass.getGateExitAt())
                .gateEntryAt(outpass.getGateEntryAt())
                .gateId(outpass.getGate() != null ? outpass.getGate().getId() : null)
                .gateName(outpass.getGate() != null ? outpass.getGate().getName() : null)
                .isLateReturn(outpass.getIsLateReturn())
                .createdAt(outpass.getCreatedAt())
                .createdByUsername(outpass.getCreatedBy() != null ? outpass.getCreatedBy().getUsername() : null)
                .build();
    }
}

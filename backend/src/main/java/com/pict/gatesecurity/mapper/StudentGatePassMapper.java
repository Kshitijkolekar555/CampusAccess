package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.studentpass.StudentGatePassResponse;
import com.pict.gatesecurity.entity.StudentGatePass;
import org.springframework.stereotype.Component;

@Component
public class StudentGatePassMapper {

    public StudentGatePassResponse toResponse(StudentGatePass pass) {
        if (pass == null) {
            return null;
        }

        return StudentGatePassResponse.builder()
                .id(pass.getId())
                .studentUserId(pass.getStudentUser() != null ? pass.getStudentUser().getId() : null)
                .studentUsername(pass.getStudentUser() != null ? pass.getStudentUser().getUsername() : null)
                .studentName(pass.getStudentName())
                .studentPrn(pass.getStudentPrn())
                .studentMobile(pass.getStudentMobile())
                .studentClass(pass.getStudentClass())
                .studentDivision(pass.getStudentDivision())
                .studentDepartment(pass.getStudentDepartment())
                .purpose(pass.getPurpose())
                .destination(pass.getDestination())
                .departureTime(pass.getDepartureTime())
                .expectedReturnTime(pass.getExpectedReturnTime())
                .actualReturnTime(pass.getActualReturnTime())
                .status(pass.getStatus())
                .approvedById(pass.getApprovedBy() != null ? pass.getApprovedBy().getId() : null)
                .approvedByName(pass.getApprovedBy() != null ? pass.getApprovedBy().getUsername() : null)
                .approvalNotes(pass.getApprovalNotes())
                .rejectionReason(pass.getRejectionReason())
                .wardenApprovedAt(pass.getWardenApprovedAt())
                .gateExitAt(pass.getGateExitAt())
                .gateEntryAt(pass.getGateEntryAt())
                .gateId(pass.getGate() != null ? pass.getGate().getId() : null)
                .gateName(pass.getGate() != null ? pass.getGate().getName() : null)
                .createdAt(pass.getCreatedAt())
                .createdByUsername(pass.getCreatedBy() != null ? pass.getCreatedBy().getUsername() : null)
                .build();
    }
}

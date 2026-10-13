package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.visitor.VisitorResponse;
import com.pict.gatesecurity.entity.Visitor;
import com.pict.gatesecurity.util.QrCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VisitorMapper {

    private final QrCodeGenerator qrCodeGenerator;

    public VisitorResponse toResponse(Visitor visitor) {
        if (visitor == null) {
            return null;
        }

        String passNumber = "PICT-PASS-" + String.format("%06d", visitor.getId());
        String qrPayload = "PICT-VISITOR:" + visitor.getId() + ":" + visitor.getMobile() + ":" + passNumber;
        String qrCodeDataUrl = qrCodeGenerator.generateQrCodeBase64(qrPayload, 250, 250);

        return VisitorResponse.builder()
                .id(visitor.getId())
                .name(visitor.getName())
                .mobile(visitor.getMobile())
                .purpose(visitor.getPurpose())
                .hostName(visitor.getHostName())
                .hostType(visitor.getHostType())
                .hostDepartment(visitor.getHostDepartment())
                .studentPrn(visitor.getStudentPrn())
                .gateId(visitor.getGate() != null ? visitor.getGate().getId() : null)
                .gateName(visitor.getGate() != null ? visitor.getGate().getName() : null)
                .vehicleNumber(visitor.getVehicleNumber())
                .timeIn(visitor.getTimeIn())
                .timeOut(visitor.getTimeOut())
                .idProofType(visitor.getIdProofType())
                .idProofNumber(visitor.getIdProofNumber())
                .photoUrl(visitor.getPhotoUrl() != null && !visitor.getPhotoUrl().isBlank() ? visitor.getPhotoUrl() : visitor.getPhotoPath())
                .faceId(visitor.getFaceId())
                .isBlacklistedMatch(visitor.getIsBlacklistedMatch())
                .notes(visitor.getNotes())
                .createdAt(visitor.getCreatedAt())
                .createdByUsername(visitor.getCreatedBy() != null ? visitor.getCreatedBy().getUsername() : null)
                .passNumber(passNumber)
                .qrCodeDataUrl(qrCodeDataUrl)
                .faceEnrolled(visitor.getFaceId() != null && !visitor.getFaceId().isBlank())
                .status(visitor.getStatus() != null ? visitor.getStatus() : com.pict.gatesecurity.entity.enums.PassStatus.APPROVED)
                .build();
    }
}

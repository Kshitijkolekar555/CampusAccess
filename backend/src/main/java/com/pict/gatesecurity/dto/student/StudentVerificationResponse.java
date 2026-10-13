package com.pict.gatesecurity.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentVerificationResponse {

    private boolean identified;
    private Long studentProfileId;
    private Long userId;
    private String prn;
    private String fullName;
    private String rollNumber;
    private String department;
    private String academicYear;
    private String division;
    private String phone;
    private String email;

    // Biometrics metadata
    private String faceId;
    private Double confidenceDistance;
    private Double similarity;
    private Boolean isAmbiguous;
    private Integer numFaces;
    private Boolean livenessPassed;
    private Map<String, Object> quality;
    private String message;

    // Gate Authorization Status
    private boolean gateAccessAuthorized;
    private String authorizationReason; // e.g. "APPROVED_GATE_PASS", "APPROVED_OUTPASS", "NO_ACTIVE_PASS"
    private Long activeGatePassId;
    private String gatePassStatus;
    private String gatePassExpectedReturn;
    private Long activeOutpassId;
    private String outpassStatus;
    private String outpassExpectedReturn;
}

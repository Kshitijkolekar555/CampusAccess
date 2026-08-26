package com.pict.gatesecurity.dto.visitor;

import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitorRecognitionResponse {
    private Boolean matched;
    private Long visitorId;
    private String visitorName;
    private String mobileNumber;
    private String hostPersonOrDepartment;
    private String purpose;
    private String photoPath;

    // Detailed visitor attributes for auto-fill
    private String hostName;
    private HostType hostType;
    private HostDepartment hostDepartment;
    private String studentPrn;
    private String idProofType;
    private String idProofNumber;
    private String vehicleNumber;
    private Double confidenceDistance;
}

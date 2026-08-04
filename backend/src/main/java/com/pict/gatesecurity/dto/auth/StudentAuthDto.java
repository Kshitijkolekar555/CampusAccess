package com.pict.gatesecurity.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAuthDto {
    private String prn;
    private String studentName;
    private String branchYear;
    private String hostelRoom;
    private String mobileNumber;
    private Boolean active;
    private String accessToken;
    private String refreshToken;
}

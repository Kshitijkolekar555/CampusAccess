package com.pict.gatesecurity.dto.faculty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyVerifyResponse {
    private boolean eligible;
    private String empNo;
    private String fullName;
    private String department;
    private String staffType;
    private String message;
}

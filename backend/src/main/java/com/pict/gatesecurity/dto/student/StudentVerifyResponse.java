package com.pict.gatesecurity.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentVerifyResponse {
    private boolean eligible;
    private String studentId;
    private String enrollmentNo;
    private String prn;
    private String rollNumber;
    private String fullName;
    private String department;
    private String academicYear;
    private String className;
    private String division;
    private String email;
    private String mobile;
    private String message;
}

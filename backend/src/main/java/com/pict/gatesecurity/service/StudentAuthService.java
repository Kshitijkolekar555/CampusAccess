package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.auth.AuthResponse;
import com.pict.gatesecurity.dto.student.StudentRegisterRequest;
import com.pict.gatesecurity.dto.student.StudentVerifyResponse;

public interface StudentAuthService {

    StudentVerifyResponse verifyStudentId(String studentId);

    AuthResponse registerStudent(StudentRegisterRequest request);
}

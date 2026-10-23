package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.auth.AuthResponse;
import com.pict.gatesecurity.dto.faculty.*;

import java.util.List;

public interface FacultyOutpassService {

    FacultyVerifyResponse verifyFacultyEmpNo(String empNo);

    AuthResponse registerFaculty(FacultyRegisterRequest request);

    FacultyOutpassResponse generateOutpass(FacultyOutpassRequest request, String username);

    FacultyOutpassResponse getMyActiveOutpass(String username);

    List<FacultyOutpassResponse> getMyOutpassHistory(String username);

    List<FacultyOutpassResponse> getActiveOutpassesForGuards(String search);

    List<FacultyOutpassResponse> getOutpassHistoryForGuards(String search);

    FacultyOutpassResponse confirmFacultyReturn(Long outpassId, FacultyReturnConfirmRequest request, String guardUsername);
}

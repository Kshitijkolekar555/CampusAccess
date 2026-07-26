package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.gate.GateCreateRequest;
import com.pict.gatesecurity.dto.gate.GateResponse;

import java.util.List;

public interface GateService {
    GateResponse createGate(GateCreateRequest request, String performingUsername);
    GateResponse updateGate(Long id, GateCreateRequest request, String performingUsername);
    GateResponse getGateById(Long id);
    List<GateResponse> getAllGates(Boolean activeOnly);
}

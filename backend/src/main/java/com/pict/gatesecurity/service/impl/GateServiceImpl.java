package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.gate.GateCreateRequest;
import com.pict.gatesecurity.dto.gate.GateResponse;
import com.pict.gatesecurity.entity.Gate;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.GateMapper;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.GateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GateServiceImpl implements GateService {

    private final GateRepository gateRepository;
    private final UserRepository userRepository;
    private final GateMapper gateMapper;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public GateResponse createGate(GateCreateRequest request, String performingUsername) {
        User performer = userRepository.findByUsername(performingUsername).orElse(null);

        Gate gate = Gate.builder()
                .name(request.getName())
                .location(request.getLocation())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        Gate savedGate = gateRepository.save(gate);

        auditLogService.logAction(performer, "CREATE_GATE", "Gate", savedGate.getId(), null, Map.of("name", savedGate.getName()));

        return gateMapper.toResponse(savedGate);
    }

    @Override
    @Transactional
    public GateResponse updateGate(Long id, GateCreateRequest request, String performingUsername) {
        Gate gate = gateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", id));

        User performer = userRepository.findByUsername(performingUsername).orElse(null);
        Map<String, Object> oldVal = Map.of("name", gate.getName(), "active", gate.getActive());

        gate.setName(request.getName());
        gate.setLocation(request.getLocation());
        if (request.getActive() != null) {
            gate.setActive(request.getActive());
        }

        Gate updatedGate = gateRepository.save(gate);

        auditLogService.logAction(performer, "UPDATE_GATE", "Gate", updatedGate.getId(), oldVal, Map.of("name", updatedGate.getName(), "active", updatedGate.getActive()));

        return gateMapper.toResponse(updatedGate);
    }

    @Override
    @Transactional(readOnly = true)
    public GateResponse getGateById(Long id) {
        Gate gate = gateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", id));
        return gateMapper.toResponse(gate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GateResponse> getAllGates(Boolean activeOnly) {
        List<Gate> gates = Boolean.TRUE.equals(activeOnly) ? gateRepository.findByActiveTrue() : gateRepository.findAll();
        return gates.stream().map(gateMapper::toResponse).collect(Collectors.toList());
    }
}

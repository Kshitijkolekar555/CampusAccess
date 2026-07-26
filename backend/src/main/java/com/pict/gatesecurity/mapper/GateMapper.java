package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.gate.GateResponse;
import com.pict.gatesecurity.entity.Gate;
import org.springframework.stereotype.Component;

@Component
public class GateMapper {

    public GateResponse toResponse(Gate gate) {
        if (gate == null) {
            return null;
        }
        return GateResponse.builder()
                .id(gate.getId())
                .name(gate.getName())
                .location(gate.getLocation())
                .active(gate.getActive())
                .createdAt(gate.getCreatedAt())
                .build();
    }
}

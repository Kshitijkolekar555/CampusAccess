package com.pict.gatesecurity.dto.gate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateResponse {

    private Long id;
    private String name;
    private String location;
    private Boolean active;
    private OffsetDateTime createdAt;
}

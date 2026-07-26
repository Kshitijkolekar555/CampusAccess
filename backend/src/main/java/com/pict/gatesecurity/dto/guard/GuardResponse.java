package com.pict.gatesecurity.dto.guard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardResponse {

    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String phone;
    private String employeeCode;
    private Long assignedGateId;
    private String assignedGateName;
    private Boolean active;
}

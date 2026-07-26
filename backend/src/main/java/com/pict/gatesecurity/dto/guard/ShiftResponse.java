package com.pict.gatesecurity.dto.guard;

import com.pict.gatesecurity.entity.enums.ShiftStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftResponse {

    private Long id;
    private Long guardId;
    private String guardName;
    private String employeeCode;
    private Long gateId;
    private String gateName;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private LocalDate date;
    private ShiftStatus status;
}

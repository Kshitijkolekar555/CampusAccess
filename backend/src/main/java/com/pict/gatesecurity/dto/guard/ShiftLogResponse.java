package com.pict.gatesecurity.dto.guard;

import com.pict.gatesecurity.entity.enums.LogType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftLogResponse {

    private Long id;
    private Long shiftId;
    private OffsetDateTime timestamp;
    private String description;
    private LogType logType;
}

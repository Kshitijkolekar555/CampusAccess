package com.pict.gatesecurity.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffBreakResponse {

    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Integer durationMinutes;
    private String status;
    private String note;
    private OffsetDateTime createdAt;
}

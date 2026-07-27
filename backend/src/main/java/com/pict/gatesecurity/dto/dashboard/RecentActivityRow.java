package com.pict.gatesecurity.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityRow {

    private Long id;
    private String entityType;
    private String action;
    private Long entityId;
    private String description;
    private String performedBy;
    private OffsetDateTime timestamp;
}

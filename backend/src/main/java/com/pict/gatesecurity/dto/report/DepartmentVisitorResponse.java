package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentVisitorResponse {

    private String department;
    private Long visitorCount;
    private Long insideNow;
    private Long blacklistedCount;
}

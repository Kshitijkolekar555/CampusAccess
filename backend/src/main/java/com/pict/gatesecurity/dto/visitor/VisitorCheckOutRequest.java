package com.pict.gatesecurity.dto.visitor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisitorCheckOutRequest {

    private Long visitorId;
    private String mobile;
    private String passCode;
    private String notes;
}

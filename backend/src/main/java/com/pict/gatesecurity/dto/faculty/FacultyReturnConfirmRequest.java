package com.pict.gatesecurity.dto.faculty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyReturnConfirmRequest {
    private String guardNotes;
    private Long gateId;
}

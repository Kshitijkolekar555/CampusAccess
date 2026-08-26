package com.pict.gatesecurity.dto.visitor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionResponse {
    private Boolean matched;
    private String faceId;
    private Double distance;
}

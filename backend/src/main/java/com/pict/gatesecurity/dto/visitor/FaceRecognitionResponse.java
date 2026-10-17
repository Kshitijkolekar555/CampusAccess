package com.pict.gatesecurity.dto.visitor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionResponse {
    private Boolean matched;
    private String faceId;
    private Double distance;
    private Double similarity;
    private Integer numFaces;
    private Boolean isAmbiguous;
    private String message;
    private String matchType;
    private Map<String, Object> quality;
}

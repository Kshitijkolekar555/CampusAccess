package com.pict.gatesecurity.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportData {

    private String title;
    private List<String> headers;
    private List<List<String>> rows;
    private String generatedAt;
}

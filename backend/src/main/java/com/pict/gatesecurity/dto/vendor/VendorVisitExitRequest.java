package com.pict.gatesecurity.dto.vendor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorVisitExitRequest {

    private String exitNote;
}

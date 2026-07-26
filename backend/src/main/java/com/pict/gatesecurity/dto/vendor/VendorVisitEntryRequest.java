package com.pict.gatesecurity.dto.vendor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorVisitEntryRequest {

    @NotNull(message = "Gate ID is required")
    private Long gateId;

    @Size(max = 255)
    private String purpose;

    private String entryNote;
}

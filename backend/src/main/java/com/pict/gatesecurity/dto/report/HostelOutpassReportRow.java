package com.pict.gatesecurity.dto.report;

import com.pict.gatesecurity.entity.enums.OutpassStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelOutpassReportRow {

    private Long id;
    private String studentName;
    private String studentPrn;
    private String studentMobile;
    private String studentHostel;
    private String studentRoom;
    private String reason;
    private String destination;
    private OffsetDateTime departureTime;
    private OffsetDateTime expectedReturnTime;
    private OffsetDateTime actualReturnTime;
    private OutpassStatus status;
    private String wardenUsername;
    private String wardenRemarks;
    private OffsetDateTime gateExitAt;
    private OffsetDateTime gateEntryAt;
    private Long gateId;
    private String gateName;
    private Boolean isLateReturn;
    private OffsetDateTime createdAt;
    private String createdByUsername;
}

package com.pict.gatesecurity.dto.report;

import com.pict.gatesecurity.entity.enums.NotificationEventType;
import com.pict.gatesecurity.entity.enums.NotificationStatus;
import com.pict.gatesecurity.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationReportRow {

    private Long id;
    private Long userId;
    private String recipient;
    private NotificationType type;
    private NotificationEventType eventType;
    private String subject;
    private NotificationStatus status;
    private Integer retryCount;
    private OffsetDateTime sentAt;
    private OffsetDateTime createdAt;
}

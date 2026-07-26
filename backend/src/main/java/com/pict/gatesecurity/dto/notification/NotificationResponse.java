package com.pict.gatesecurity.dto.notification;

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
public class NotificationResponse {

    private Long id;
    private Long userId;
    private String recipient;
    private NotificationType type;
    private NotificationEventType eventType;
    private String subject;
    private String body;
    private NotificationStatus status;
    private Integer retryCount;
    private Integer maxRetries;
    private String errorMessage;
    private OffsetDateTime sentAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}

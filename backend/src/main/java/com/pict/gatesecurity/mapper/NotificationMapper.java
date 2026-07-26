package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.notification.NotificationResponse;
import com.pict.gatesecurity.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        if (notification == null) {
            return null;
        }
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUser() != null ? notification.getUser().getId() : null)
                .recipient(notification.getRecipient())
                .type(notification.getType())
                .eventType(notification.getEventType())
                .subject(notification.getSubject())
                .body(notification.getBody())
                .status(notification.getStatus())
                .retryCount(notification.getRetryCount())
                .maxRetries(notification.getMaxRetries())
                .errorMessage(notification.getErrorMessage())
                .sentAt(notification.getSentAt())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }
}

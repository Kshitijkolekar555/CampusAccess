package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.notification.NotificationResponse;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.NotificationEventType;
import com.pict.gatesecurity.entity.enums.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;

public interface NotificationService {

    NotificationResponse sendNotification(User user, String recipient, NotificationEventType eventType,
                                          String subject, String body);

    void sendPasswordResetEmail(User user, String token);

    void sendPasswordChangedEmail(User user);

    void sendAccountCreatedEmail(User user);

    void sendGatePassApproved(User user, String studentName, Long passId);

    void sendGatePassRejected(User user, String studentName, Long passId, String reason);

    void sendOutpassApproved(User user, String studentName, Long outpassId);

    void sendOutpassRejected(User user, String studentName, Long outpassId, String reason);

    void sendOutpassSubmitted(User user, String studentName, Long outpassId);

    void sendOutpassReturned(User user, String studentName, Long outpassId);

    void sendSecurityAlert(User recipient, String message);

    void retryFailedNotifications();

    NotificationResponse getNotificationById(Long id);

    Page<NotificationResponse> getNotifications(String recipient, NotificationEventType eventType,
                                                 NotificationStatus status,
                                                 OffsetDateTime dateFrom, OffsetDateTime dateTo,
                                                 Pageable pageable);

    NotificationResponse resendNotification(Long id);

    void deleteNotification(Long id);
}

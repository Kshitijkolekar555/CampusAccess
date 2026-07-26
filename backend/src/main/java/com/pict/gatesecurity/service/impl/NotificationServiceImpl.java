package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.notification.NotificationResponse;
import com.pict.gatesecurity.entity.Notification;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.NotificationEventType;
import com.pict.gatesecurity.entity.enums.NotificationStatus;
import com.pict.gatesecurity.entity.enums.NotificationType;
import com.pict.gatesecurity.mapper.NotificationMapper;
import com.pict.gatesecurity.repository.NotificationRepository;
import com.pict.gatesecurity.service.EmailService;
import com.pict.gatesecurity.service.NotificationService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final EmailService emailService;
    private final TemplateEngine templateEngine;

    @Override
    @Transactional
    public NotificationResponse sendNotification(User user, String recipient,
                                                  NotificationEventType eventType,
                                                  String subject, String body) {
        Notification notification = Notification.builder()
                .user(user)
                .recipient(recipient)
                .type(NotificationType.EMAIL)
                .eventType(eventType)
                .subject(subject)
                .body(body)
                .status(NotificationStatus.PENDING)
                .retryCount(0)
                .maxRetries(3)
                .build();

        Notification saved = notificationRepository.save(notification);
        sendAsync(saved);
        return notificationMapper.toResponse(saved);
    }

    @Async("notificationExecutor")
    @Transactional
    public void sendAsync(Notification notification) {
        try {
            emailService.sendEmail(notification);
            notification.setStatus(NotificationStatus.SENT);
            notification.setSentAt(OffsetDateTime.now());
            log.info("Notification {} sent to {}", notification.getId(), notification.getRecipient());
        } catch (Exception e) {
            log.error("Failed to send notification {} to {}: {}",
                    notification.getId(), notification.getRecipient(), e.getMessage());
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            notification.setRetryCount(notification.getRetryCount() + 1);
            notification.setLastAttemptAt(OffsetDateTime.now());
        }
        notificationRepository.save(notification);
    }

    private void send(Notification notification) {
        String subject = notification.getSubject();
        String body = notification.getBody();
        Notification saved = notificationRepository.save(notification);
        sendAsync(saved);
    }

    @Override
    @Transactional
    public void sendPasswordResetEmail(User user, String token) {
        Context context = new Context();
        context.setVariable("name", user.getFullName());
        context.setVariable("token", token);

        String subject = "PICT Gate Security - Password Reset";
        String body = templateEngine.process("email/password-reset", context);

        Notification notification = buildNotification(user, user.getEmail(),
                NotificationEventType.PASSWORD_RESET, subject, body);
        send(notification);
    }

    @Override
    @Transactional
    public void sendPasswordChangedEmail(User user) {
        Context context = new Context();
        context.setVariable("name", user.getFullName());

        String subject = "PICT Gate Security - Password Changed";
        String body = templateEngine.process("email/password-changed", context);

        Notification notification = buildNotification(user, user.getEmail(),
                NotificationEventType.PASSWORD_CHANGED, subject, body);
        send(notification);
    }

    @Override
    @Transactional
    public void sendAccountCreatedEmail(User user) {
        Context context = new Context();
        context.setVariable("name", user.getFullName());
        context.setVariable("username", user.getUsername());
        context.setVariable("role", user.getRole().name());

        String subject = "Welcome to PICT Gate Security";
        String body = templateEngine.process("email/account-created", context);

        Notification notification = buildNotification(user, user.getEmail(),
                NotificationEventType.ACCOUNT_CREATED, subject, body);
        send(notification);
    }

    @Override
    @Transactional
    public void sendGatePassApproved(User user, String studentName, Long passId) {
        Context context = new Context();
        context.setVariable("studentName", studentName);
        context.setVariable("passId", passId);

        String subject = "Gate Pass Approved";
        String body = templateEngine.process("email/gatepass-approved", context);

        Notification notification = buildNotification(user, user.getEmail(),
                NotificationEventType.STUDENT_GATEPASS_APPROVED, subject, body);
        send(notification);
    }

    @Override
    @Transactional
    public void sendGatePassRejected(User user, String studentName, Long passId, String reason) {
        Context context = new Context();
        context.setVariable("studentName", studentName);
        context.setVariable("passId", passId);
        context.setVariable("reason", reason);

        String subject = "Gate Pass Rejected";
        String body = templateEngine.process("email/gatepass-rejected", context);

        Notification notification = buildNotification(user, user.getEmail(),
                NotificationEventType.STUDENT_GATEPASS_REJECTED, subject, body);
        send(notification);
    }

    @Override
    @Transactional
    public void sendOutpassApproved(User user, String studentName, Long outpassId) {
        Context context = new Context();
        context.setVariable("studentName", studentName);
        context.setVariable("outpassId", outpassId);

        String subject = "Hostel Outpass Approved";
        String body = templateEngine.process("email/outpass-approved", context);

        Notification notification = buildNotification(user, user.getEmail(),
                NotificationEventType.HOSTEL_OUTPASS_APPROVED, subject, body);
        send(notification);
    }

    @Override
    @Transactional
    public void sendOutpassRejected(User user, String studentName, Long outpassId, String reason) {
        Context context = new Context();
        context.setVariable("studentName", studentName);
        context.setVariable("outpassId", outpassId);
        context.setVariable("reason", reason);

        String subject = "Hostel Outpass Rejected";
        String body = templateEngine.process("email/outpass-rejected", context);

        Notification notification = buildNotification(user, user.getEmail(),
                NotificationEventType.HOSTEL_OUTPASS_REJECTED, subject, body);
        send(notification);
    }

    @Override
    @Transactional
    public void sendSecurityAlert(User recipient, String message) {
        Context context = new Context();
        context.setVariable("name", recipient.getFullName());
        context.setVariable("message", message);
        context.setVariable("timestamp", OffsetDateTime.now().toString());

        String subject = "SECURITY ALERT - PICT Gate Security";
        String body = templateEngine.process("email/security-alert", context);

        Notification notification = buildNotification(recipient, recipient.getEmail(),
                NotificationEventType.SECURITY_ALERT, subject, body);
        send(notification);
    }

    @Override
    @Transactional
    public void retryFailedNotifications() {
        Page<Notification> failed = notificationRepository
                .findByStatusAndRetryCountLessThan(NotificationStatus.FAILED, 3, Pageable.unpaged());
        for (Notification notification : failed.getContent()) {
            notification.setStatus(NotificationStatus.RETRYING);
            notification.setRetryCount(notification.getRetryCount() + 1);
            notification.setLastAttemptAt(OffsetDateTime.now());
            notificationRepository.save(notification);

            try {
                emailService.sendEmail(notification);
                notification.setStatus(NotificationStatus.SENT);
                notification.setSentAt(OffsetDateTime.now());
                notification.setErrorMessage(null);
                log.info("Retry successful for notification {}", notification.getId());
            } catch (Exception e) {
                log.warn("Retry {} failed for notification {}: {}",
                        notification.getRetryCount(), notification.getId(), e.getMessage());
                notification.setStatus(NotificationStatus.FAILED);
                notification.setErrorMessage(e.getMessage());
            }
            notificationRepository.save(notification);
        }
    }

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void scheduledRetry() {
        retryFailedNotifications();
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getNotificationById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
        return notificationMapper.toResponse(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(String recipient, NotificationEventType eventType,
                                                        NotificationStatus status,
                                                        OffsetDateTime dateFrom, OffsetDateTime dateTo,
                                                        Pageable pageable) {
        Specification<Notification> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (recipient != null && !recipient.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("recipient")),
                        "%" + recipient.toLowerCase() + "%"));
            }
            if (eventType != null) {
                predicates.add(cb.equal(root.get("eventType"), eventType));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
            }
            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dateTo));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return notificationRepository.findAll(spec, pageable).map(notificationMapper::toResponse);
    }

    @Override
    @Transactional
    public NotificationResponse resendNotification(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));

        notification.setRetryCount(0);
        notification.setErrorMessage(null);
        notification.setStatus(NotificationStatus.PENDING);
        Notification saved = notificationRepository.save(notification);

        sendAsync(saved);
        return notificationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }

    private Notification buildNotification(User user, String recipient,
                                            NotificationEventType eventType,
                                            String subject, String body) {
        return Notification.builder()
                .user(user)
                .recipient(recipient)
                .type(NotificationType.EMAIL)
                .eventType(eventType)
                .subject(subject)
                .body(body)
                .status(NotificationStatus.PENDING)
                .retryCount(0)
                .maxRetries(3)
                .build();
    }
}

package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.notification.NotificationResponse;
import com.pict.gatesecurity.entity.Notification;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.mapper.NotificationMapper;
import com.pict.gatesecurity.repository.NotificationRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationMapper notificationMapper;
    @Mock private EmailService emailService;
    @Mock private TemplateEngine templateEngine;
    @Mock private UserRepository userRepository;

    @Captor private ArgumentCaptor<Notification> notificationCaptor;

    private NotificationServiceImpl notificationService;
    private User testUser;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(
                notificationRepository, notificationMapper, emailService, templateEngine, userRepository);

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .fullName("Test User")
                .role(UserRole.VISITOR)
                .active(true)
                .build();
    }

    private Notification cloneNotification(Notification n) {
        return Notification.builder()
                .id(1L)
                .user(n.getUser())
                .recipient(n.getRecipient())
                .type(n.getType())
                .eventType(n.getEventType())
                .subject(n.getSubject())
                .body(n.getBody())
                .status(n.getStatus())
                .retryCount(n.getRetryCount())
                .maxRetries(n.getMaxRetries())
                .errorMessage(n.getErrorMessage())
                .build();
    }

    @Test
    void sendPasswordResetEmail_shouldCreateAndSend() {
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Reset</body></html>");
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));

        notificationService.sendPasswordResetEmail(testUser, "reset-token-123");

        verify(notificationRepository, times(2)).save(notificationCaptor.capture());
        Notification first = notificationCaptor.getAllValues().get(0);
        assertEquals("test@example.com", first.getRecipient());
        assertEquals(NotificationEventType.PASSWORD_RESET, first.getEventType());
        assertEquals(NotificationStatus.PENDING, first.getStatus());
        Notification second = notificationCaptor.getAllValues().get(1);
        assertEquals(NotificationStatus.SENT, second.getStatus());
    }

    @Test
    void sendPasswordChangedEmail_shouldCreateAndSend() {
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Changed</body></html>");
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));

        notificationService.sendPasswordChangedEmail(testUser);

        verify(notificationRepository, atLeastOnce()).save(notificationCaptor.capture());
        Notification saved = notificationCaptor.getAllValues().get(0);
        assertEquals(NotificationEventType.PASSWORD_CHANGED, saved.getEventType());
    }

    @Test
    void sendAccountCreatedEmail_shouldCreateAndSend() {
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Welcome</body></html>");
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));

        notificationService.sendAccountCreatedEmail(testUser);

        verify(notificationRepository, atLeastOnce()).save(notificationCaptor.capture());
        Notification saved = notificationCaptor.getAllValues().get(0);
        assertEquals(NotificationEventType.ACCOUNT_CREATED, saved.getEventType());
    }

    @Test
    void sendGatePassApproved_shouldSendEmail() {
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Approved</body></html>");
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));

        notificationService.sendGatePassApproved(testUser, "Student", 1L);

        verify(notificationRepository, atLeastOnce()).save(notificationCaptor.capture());
        assertEquals(NotificationEventType.STUDENT_GATEPASS_APPROVED, notificationCaptor.getAllValues().get(0).getEventType());
    }

    @Test
    void sendGatePassRejected_shouldSendEmailWithReason() {
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Rejected</body></html>");
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));

        notificationService.sendGatePassRejected(testUser, "Student", 1L, "Incomplete documentation");

        verify(notificationRepository, atLeastOnce()).save(notificationCaptor.capture());
        assertEquals(NotificationEventType.STUDENT_GATEPASS_REJECTED, notificationCaptor.getAllValues().get(0).getEventType());
    }

    @Test
    void sendOutpassApproved_shouldSendEmail() {
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Approved</body></html>");
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));

        notificationService.sendOutpassApproved(testUser, "Student", 1L);

        verify(notificationRepository, atLeastOnce()).save(notificationCaptor.capture());
        assertEquals(NotificationEventType.HOSTEL_OUTPASS_APPROVED, notificationCaptor.getAllValues().get(0).getEventType());
    }

    @Test
    void sendOutpassRejected_shouldSendEmailWithReason() {
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Rejected</body></html>");
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));

        notificationService.sendOutpassRejected(testUser, "Student", 1L, "Invalid reason");

        verify(notificationRepository, atLeastOnce()).save(notificationCaptor.capture());
        assertEquals(NotificationEventType.HOSTEL_OUTPASS_REJECTED, notificationCaptor.getAllValues().get(0).getEventType());
    }

    @Test
    void sendSecurityAlert_shouldSend() {
        when(templateEngine.process(anyString(), any(Context.class))).thenReturn("<html><body>Alert</body></html>");
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));

        notificationService.sendSecurityAlert(testUser, "Suspicious activity detected");

        verify(notificationRepository, atLeastOnce()).save(notificationCaptor.capture());
        assertEquals(NotificationEventType.SECURITY_ALERT, notificationCaptor.getAllValues().get(0).getEventType());
    }

    @Test
    void getNotificationById_shouldReturnResponse() {
        Notification testNotification = Notification.builder()
                .id(1L).user(testUser).recipient("test@example.com")
                .type(NotificationType.EMAIL).eventType(NotificationEventType.PASSWORD_RESET)
                .subject("Test").body("<html></html>")
                .status(NotificationStatus.PENDING).retryCount(0).maxRetries(3).build();
        NotificationResponse response = NotificationResponse.builder().id(1L).build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(testNotification));
        when(notificationMapper.toResponse(testNotification)).thenReturn(response);

        NotificationResponse result = notificationService.getNotificationById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getNotificationById_shouldThrowWhenNotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> notificationService.getNotificationById(99L));
    }

    @Test
    void resendNotification_shouldResetAndSend() {
        Notification failedNotification = Notification.builder()
                .id(1L)
                .user(testUser)
                .recipient("test@example.com")
                .type(NotificationType.EMAIL)
                .status(NotificationStatus.FAILED)
                .retryCount(2)
                .errorMessage("Previous error")
                .maxRetries(3)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(failedNotification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> cloneNotification(i.getArgument(0)));
        when(notificationMapper.toResponse(any(Notification.class)))
                .thenReturn(NotificationResponse.builder().id(1L).build());

        notificationService.resendNotification(1L);

        verify(notificationRepository, times(2)).save(notificationCaptor.capture());
        Notification reset = notificationCaptor.getAllValues().get(0);
        assertEquals(0, reset.getRetryCount());
        assertEquals(NotificationStatus.PENDING, reset.getStatus());
        assertNull(reset.getErrorMessage());
    }

    @Test
    void getNotifications_shouldFilterByStatus() {
        Notification testNotification = Notification.builder()
                .id(1L).user(testUser).recipient("test@example.com")
                .type(NotificationType.EMAIL).eventType(NotificationEventType.PASSWORD_RESET)
                .subject("Test").body("<html></html>")
                .status(NotificationStatus.SENT).retryCount(0).maxRetries(3).build();
        NotificationResponse response = NotificationResponse.builder().id(1L).status(NotificationStatus.SENT).build();
        Page<Notification> page = new PageImpl<>(List.of(testNotification));

        when(notificationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(notificationMapper.toResponse(any(Notification.class))).thenReturn(response);

        Page<NotificationResponse> result = notificationService.getNotifications(
                null, null, NotificationStatus.SENT, null, null, Pageable.unpaged());

        assertFalse(result.isEmpty());
        assertEquals(1, result.getContent().size());
    }

    @Test
    void deleteNotification_shouldCallRepository() {
        notificationService.deleteNotification(1L);
        verify(notificationRepository).deleteById(1L);
    }
}

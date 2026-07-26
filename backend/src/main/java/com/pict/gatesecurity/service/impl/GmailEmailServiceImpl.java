package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.entity.Notification;
import com.pict.gatesecurity.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailEmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendEmail(Notification notification) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(notification.getRecipient());
            helper.setSubject(notification.getSubject());
            helper.setText(notification.getBody(), true);
            mailSender.send(message);
            log.debug("Email sent to {}: {}", notification.getRecipient(), notification.getSubject());
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", notification.getRecipient(), e.getMessage());
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean isConfigured() {
        return true;
    }
}

package com.medinex.common.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${medinex.mail.from-address:noreply@medinex.health}")
    private String fromAddress;

    @Async
    public void sendVerificationEmail(String recipientEmail, String recipientName, String rawToken) {
        log.info("[EMAIL SERVICE] Dispatching verification token to {} (Token: {})", recipientEmail, rawToken);
        sendEmail(recipientEmail, "Verify your MediNex Account",
                String.format("Hello %s,\n\nWelcome to MediNex! Please verify your community account with this token:\n\n%s\n\nThis token will expire in 24 hours.\n\nBest regards,\nMediNex Team",
                        recipientName, rawToken));
    }

    @Async
    public void sendPasswordResetEmail(String recipientEmail, String recipientName, String rawToken) {
        log.info("[EMAIL SERVICE] Dispatching password reset token to {} (Token: {})", recipientEmail, rawToken);
        sendEmail(recipientEmail, "MediNex Password Reset Request",
                String.format("Hello %s,\n\nWe received a request to reset your MediNex password. Use the token below to reset your password:\n\n%s\n\nThis token will expire in 1 hour. If you did not request this, please ignore this email.\n\nBest regards,\nMediNex Team",
                        recipientName, rawToken));
    }

    private void sendEmail(String to, String subject, String body) {
        if (mailSender == null) {
            log.warn("[EMAIL SERVICE] JavaMailSender not configured; simulated email to {} with subject: {}", to, subject);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("[EMAIL SERVICE] Successfully dispatched email to {}", to);
        } catch (Exception e) {
            log.warn("[EMAIL SERVICE] Failed to send email to {}: {}. Token remains valid in database/logs.", to, e.getMessage());
        }
    }
}

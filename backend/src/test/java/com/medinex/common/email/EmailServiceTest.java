package com.medinex.common.email;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(OutputCaptureExtension.class)
class EmailServiceTest {

    @Test
    void shouldDispatchSmtpMessageAndNeverLogPlaintextCredentials(CapturedOutput output) {
        JavaMailSender sender = mock(JavaMailSender.class);
        EmailService service = new EmailService();
        ReflectionTestUtils.setField(service, "mailSender", sender);
        ReflectionTestUtils.setField(service, "fromAddress", "noreply@medinex.test");
        ReflectionTestUtils.setField(service, "fromName", "MediNex Test");
        ReflectionTestUtils.setField(service, "mailHost", "localhost");
        ReflectionTestUtils.setField(service, "mailPassword", "secret-app-password-should-never-log");
        ReflectionTestUtils.setField(service, "smtpAuth", true);

        boolean otpSent = service.sendVerificationEmail("user@medinex.test", "Test User", "482913");
        boolean resetSent = service.sendPasswordResetEmail("user@medinex.test", "Test User", "ResetSecretToken98765432");

        assertTrue(otpSent);
        assertTrue(resetSent);
        verify(sender, times(2)).send(any(SimpleMailMessage.class));

        String logs = output.getAll();
        assertFalse(logs.contains("482913"));
        assertFalse(logs.contains("ResetSecretToken98765432"));
        assertFalse(logs.contains("secret-app-password-should-never-log"));
    }

    @Test
    void shouldReturnFalseWhenConfiguredSmtpThrowsMailException(CapturedOutput output) {
        JavaMailSender sender = mock(JavaMailSender.class);
        doThrow(new MailSendException("Simulated transient SMTP timeout"))
                .when(sender).send(any(SimpleMailMessage.class));

        EmailService service = new EmailService();
        ReflectionTestUtils.setField(service, "mailSender", sender);
        ReflectionTestUtils.setField(service, "fromAddress", "noreply@medinex.test");
        ReflectionTestUtils.setField(service, "fromName", "MediNex Test");
        ReflectionTestUtils.setField(service, "mailHost", "smtp.gmail.com");
        ReflectionTestUtils.setField(service, "mailPassword", "dummy-configured-pass");
        ReflectionTestUtils.setField(service, "smtpAuth", true);

        boolean dispatched = service.sendVerificationEmail("retry@medinex.test", "Retry User", "918273");
        assertFalse(dispatched);

        String logs = output.getAll();
        assertFalse(logs.contains("918273"));
    }

    @Test
    void shouldDispatchContactInquiryWithSanitizedHeaders() {
        JavaMailSender sender = mock(JavaMailSender.class);
        EmailService service = new EmailService();
        ReflectionTestUtils.setField(service, "mailSender", sender);
        ReflectionTestUtils.setField(service, "fromAddress", "team@medinex.test");
        ReflectionTestUtils.setField(service, "fromName", "MediNex Test");
        ReflectionTestUtils.setField(service, "mailHost", "localhost");
        ReflectionTestUtils.setField(service, "mailPassword", "");
        ReflectionTestUtils.setField(service, "smtpAuth", false);

        boolean sent = service.sendContactInquiry(
                "Dr. Alice\r\nBcc: evil@attacker.test",
                "alice@example.org",
                "COLLABORATION",
                "FHIR Inquiry\nInjected-Header: true",
                "Hello team!"
        );

        assertTrue(sent);
        verify(sender, times(1)).send(argThat((SimpleMailMessage msg) ->
                msg.getSubject() != null
                        && !msg.getSubject().contains("\n")
                        && !msg.getSubject().contains("\r")
                        && msg.getTo() != null
                        && msg.getTo().length == 1
                        && "team@medinex.test".equals(msg.getTo()[0])
        ));
    }
}

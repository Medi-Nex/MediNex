package com.medinex.common.email;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(OutputCaptureExtension.class)
class EmailServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

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

    @Test
    void shouldPreferBrevoHttpsApiOverSmtpWhenApiKeyIsConfigured(CapturedOutput output) throws Exception {
        AtomicReference<String> capturedApiKey = new AtomicReference<>();
        AtomicReference<String> capturedBody = new AtomicReference<>();

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v3/smtp/email", exchange -> {
            capturedApiKey.set(exchange.getRequestHeaders().getFirst("api-key"));
            capturedBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] responseBytes = "{\"messageId\":\"<msg-test-01>\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(201, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        });
        server.start();

        try {
            JavaMailSender smtpSender = mock(JavaMailSender.class);
            EmailService service = new EmailService();
            ReflectionTestUtils.setField(service, "mailSender", smtpSender);
            ReflectionTestUtils.setField(service, "fromAddress", "medinexbd.noreply@gmail.com");
            ReflectionTestUtils.setField(service, "fromName", "MediNex Platform");
            ReflectionTestUtils.setField(service, "brevoApiKey", "xkeysib-secret-test-key");
            ReflectionTestUtils.setField(
                    service,
                    "brevoApiUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/v3/smtp/email"
            );

            boolean dispatched = service.sendVerificationEmail("newuser@gmail.com", "New User", "739104");
            assertTrue(dispatched);
            verifyNoInteractions(smtpSender);

            assertEquals("xkeysib-secret-test-key", capturedApiKey.get());
            JsonNode json = objectMapper.readTree(capturedBody.get());
            assertEquals("medinexbd.noreply@gmail.com", json.path("sender").path("email").asText());
            assertEquals("MediNex Platform", json.path("sender").path("name").asText());
            assertEquals("newuser@gmail.com", json.path("to").get(0).path("email").asText());
            assertEquals("New User", json.path("to").get(0).path("name").asText());
            assertTrue(json.path("textContent").asText().contains("739104"));

            boolean contactDispatched = service.sendContactInquiry(
                    "Dr. Bob\r\nSpoofed: true",
                    "bob@example.org",
                    "RESEARCH",
                    "Clinical Data\nSync",
                    "Interested in collaboration."
            );
            assertTrue(contactDispatched);
            JsonNode contactJson = objectMapper.readTree(capturedBody.get());
            assertEquals("bob@example.org", contactJson.path("replyTo").path("email").asText());
            assertFalse(contactJson.path("subject").asText().contains("\n"));

            String logs = output.getAll();
            assertFalse(logs.contains("739104"));
            assertFalse(logs.contains("xkeysib-secret-test-key"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void shouldReturnFalseWhenBrevoHttpsApiReturnsErrorStatus(CapturedOutput output) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v3/smtp/email", exchange -> {
            byte[] responseBytes = "{\"code\":\"unauthorized\",\"message\":\"Key not found\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(401, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        });
        server.start();

        try {
            EmailService service = new EmailService();
            ReflectionTestUtils.setField(service, "fromAddress", "medinexbd.noreply@gmail.com");
            ReflectionTestUtils.setField(service, "fromName", "MediNex Platform");
            ReflectionTestUtils.setField(service, "brevoApiKey", "xkeysib-invalid-key-secret");
            ReflectionTestUtils.setField(
                    service,
                    "brevoApiUrl",
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/v3/smtp/email"
            );

            boolean dispatched = service.sendVerificationEmail("user@example.org", "User", "654321");
            assertFalse(dispatched);

            String logs = output.getAll();
            assertTrue(logs.contains("HTTP 401"));
            assertFalse(logs.contains("654321"));
            assertFalse(logs.contains("xkeysib-invalid-key-secret"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void shouldDispatchViaMailWebhookFollowingAppsScriptRedirectWithoutLoggingSecret(CapturedOutput output) throws Exception {
        AtomicReference<String> capturedPostBody = new AtomicReference<>();
        AtomicReference<String> echoMethod = new AtomicReference<>();

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        int port = server.getAddress().getPort();
        // Apps Script Web Apps reply with HTTP 302 redirecting to a script.googleusercontent.com GET echo
        server.createContext("/exec", exchange -> {
            capturedPostBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.getResponseHeaders().add("Location", "http://127.0.0.1:" + port + "/echo");
            exchange.sendResponseHeaders(302, -1);
            exchange.close();
        });
        server.createContext("/echo", exchange -> {
            echoMethod.set(exchange.getRequestMethod());
            byte[] responseBytes = "{\"ok\":true}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        });
        server.start();

        try {
            JavaMailSender smtpSender = mock(JavaMailSender.class);
            EmailService service = new EmailService();
            ReflectionTestUtils.setField(service, "mailSender", smtpSender);
            ReflectionTestUtils.setField(service, "fromAddress", "medinexbd.noreply@gmail.com");
            ReflectionTestUtils.setField(service, "fromName", "MediNex Platform");
            ReflectionTestUtils.setField(service, "mailWebhookUrl", "http://127.0.0.1:" + port + "/exec");
            ReflectionTestUtils.setField(service, "mailWebhookSecret", "webhook-top-secret-value");
            ReflectionTestUtils.setField(service, "brevoApiKey", "xkeysib-unused-when-webhook-set");

            boolean otpSent = service.sendVerificationEmail("student@gmail.com", "Student One", "829401");
            assertTrue(otpSent);
            assertEquals("GET", echoMethod.get());
            verifyNoInteractions(smtpSender);

            JsonNode otpPayload = objectMapper.readTree(capturedPostBody.get());
            assertEquals("student@gmail.com", otpPayload.path("to").asText());
            assertEquals("Student One", otpPayload.path("recipientName").asText());
            assertEquals("MediNex Platform", otpPayload.path("fromName").asText());
            assertEquals("webhook-top-secret-value", otpPayload.path("secret").asText());
            assertTrue(otpPayload.path("body").asText().contains("829401"));

            boolean contactSent = service.sendContactInquiry(
                    "Dr. Hasan\r\nSpoof: 1",
                    "hasan@example.org",
                    "SUPPORT",
                    "Need Access\nFast",
                    "Please help."
            );
            assertTrue(contactSent);
            JsonNode contactPayload = objectMapper.readTree(capturedPostBody.get());
            assertEquals("hasan@example.org", contactPayload.path("replyTo").asText());
            assertEquals("Dr. Hasan Spoof: 1", contactPayload.path("replyToName").asText());
            assertFalse(contactPayload.path("subject").asText().contains("\n"));

            String logs = output.getAll();
            assertFalse(logs.contains("829401"));
            assertFalse(logs.contains("webhook-top-secret-value"));
        } finally {
            server.stop(0);
        }
    }

    @Test
    void shouldReturnFalseWhenMailWebhookRejectsOrReturnsHtmlLoginRedirect() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/reject", exchange -> {
            byte[] responseBytes = "{\"ok\":false,\"error\":\"Unauthorized\"}".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        });
        server.createContext("/login-html", exchange -> {
            byte[] responseBytes = "<!doctype html><html><body>Sign in</body></html>".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        });
        server.start();

        try {
            int port = server.getAddress().getPort();
            EmailService service = new EmailService();
            ReflectionTestUtils.setField(service, "mailWebhookSecret", "wrong-secret");

            ReflectionTestUtils.setField(service, "mailWebhookUrl", "http://127.0.0.1:" + port + "/reject");
            assertFalse(service.sendVerificationEmail("u@example.org", "User", "112233"));

            ReflectionTestUtils.setField(service, "mailWebhookUrl", "http://127.0.0.1:" + port + "/login-html");
            assertFalse(service.sendVerificationEmail("u@example.org", "User", "445566"));
        } finally {
            server.stop(0);
        }
    }
}

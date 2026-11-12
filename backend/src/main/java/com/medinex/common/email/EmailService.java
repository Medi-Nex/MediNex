package com.medinex.common.email;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private static final String DEFAULT_FROM_ADDRESS = "medinexbd.noreply@gmail.com";
    private static final String DEFAULT_FROM_NAME = "MediNex Platform";
    private static final String DEFAULT_BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    // Google Apps Script Web Apps return HTTP 302 to script.googleusercontent.com after executing doPost(e)
    private final HttpClient redirectHttpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${medinex.mail.from-address:" + DEFAULT_FROM_ADDRESS + "}")
    private String fromAddress = DEFAULT_FROM_ADDRESS;

    @Value("${medinex.mail.from-name:" + DEFAULT_FROM_NAME + "}")
    private String fromName = DEFAULT_FROM_NAME;

    @Value("${medinex.mail.webhook.url:}")
    private String mailWebhookUrl = "";

    @Value("${medinex.mail.webhook.secret:}")
    private String mailWebhookSecret = "";

    @Value("${medinex.mail.brevo.api-key:}")
    private String brevoApiKey = "";

    @Value("${medinex.mail.brevo.api-url:" + DEFAULT_BREVO_API_URL + "}")
    private String brevoApiUrl = DEFAULT_BREVO_API_URL;

    @Value("${spring.mail.host:}")
    private String mailHost = "";

    @Value("${spring.mail.password:}")
    private String mailPassword = "";

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean smtpAuth = true;

    /**
     * Dispatches a verification OTP email without ever logging the raw credential.
     *
     * @return true if dispatched via configured HTTPS webhook / Brevo API / SMTP (or intentionally skipped in unconfigured local/test envs),
     * false if live delivery failed transiently.
     */
    public boolean sendVerificationEmail(String recipientEmail, String recipientName, String rawOtp) {
        log.info("[EMAIL SERVICE] Dispatching verification code to {} (OTP redacted)", recipientEmail);
        return sendEmail(recipientEmail, recipientName, "Your MediNex Verification Code (OTP)",
                String.format("Hello %s,\n\nWelcome to MediNex! Your 6-digit email verification OTP is:\n\n%s\n\nEnter this 6-digit code with your email on the MediNex Verify Email page. It expires in 10 minutes and locks after 5 incorrect attempts.\n\nBest regards,\nMediNex Team",
                        recipientName, rawOtp),
                null, null);
    }

    /**
     * Dispatches a password reset OTP email without ever logging the raw code.
     */
    public boolean sendPasswordResetEmail(String recipientEmail, String recipientName, String rawOtp) {
        log.info("[EMAIL SERVICE] Dispatching password reset OTP to {} (OTP redacted)", recipientEmail);
        return sendEmail(recipientEmail, recipientName, "Your MediNex Password Reset Code (OTP)",
                String.format("Hello %s,\n\nWe received a request to reset your MediNex password. Your 6-digit password reset OTP is:\n\n%s\n\nEnter this 6-digit code with your email on the MediNex Reset Password page. It expires in 10 minutes and locks after 5 incorrect attempts. If you did not request this, please ignore this email.\n\nBest regards,\nMediNex Team",
                        recipientName, rawOtp),
                null, null);
    }

    /**
     * Dispatches a public contact inquiry to the official platform inbox without header injection.
     */
    public boolean sendContactInquiry(String senderName, String senderEmail, String category, String subject, String message) {
        String cleanName = sanitizeSingleLine(senderName);
        String cleanEmail = sanitizeSingleLine(senderEmail);
        String cleanCategory = sanitizeSingleLine(category);
        String cleanSubject = sanitizeSingleLine(subject);
        String recipient = resolveFromAddress();

        log.info("[EMAIL SERVICE] Dispatching public contact inquiry [{}] from {}", cleanCategory, cleanEmail);
        return sendEmail(
                recipient,
                resolveFromName(),
                String.format("[MediNex Contact - %s] %s", cleanCategory, cleanSubject),
                String.format("New Contact Inquiry via MediNex Portal\n\nFrom: %s <%s>\nCategory: %s\nSubject: %s\n\nMessage:\n%s",
                        cleanName, cleanEmail, cleanCategory, cleanSubject, message),
                cleanEmail,
                cleanName
        );
    }

    private String resolveFromAddress() {
        String safe = sanitizeSingleLine(fromAddress);
        return safe.isBlank() ? DEFAULT_FROM_ADDRESS : safe;
    }

    private String resolveFromName() {
        String safe = sanitizeSingleLine(fromName);
        return safe.isBlank() ? DEFAULT_FROM_NAME : safe;
    }

    private String sanitizeSingleLine(String input) {
        return input == null ? "" : input.replaceAll("[\\r\\n]+", " ").trim();
    }

    private String sanitizeLogSnippet(String input) {
        String singleLine = sanitizeSingleLine(input);
        return singleLine.length() > 200 ? singleLine.substring(0, 200) + "..." : singleLine;
    }

    private boolean sendEmail(String to, String recipientName, String subject, String body, String replyToEmail, String replyToName) {
        String cleanTo = sanitizeSingleLine(to);
        String cleanSubject = sanitizeSingleLine(subject);

        // Prefer HTTPS transports when configured (works on PaaS tiers where outbound SMTP ports are blocked)
        if (mailWebhookUrl != null && !mailWebhookUrl.isBlank()) {
            return sendViaWebhook(cleanTo, recipientName, cleanSubject, body, replyToEmail, replyToName);
        }

        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            return sendViaBrevo(cleanTo, recipientName, cleanSubject, body, replyToEmail, replyToName);
        }

        if (mailSender == null || mailHost == null || mailHost.isBlank()) {
            log.warn("[EMAIL SERVICE] No live email transport configured (MAIL_WEBHOOK_URL, BREVO_API_KEY, or SMTP host); skipped live dispatch to {} (subject: {})", cleanTo, cleanSubject);
            return true;
        }

        if (smtpAuth && (mailPassword == null || mailPassword.isBlank())) {
            log.warn("[EMAIL SERVICE] Neither MAIL_WEBHOOK_URL, BREVO_API_KEY, nor MAIL_PASSWORD configured; skipped live SMTP dispatch via {} to {}", mailHost, cleanTo);
            return true;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            String safeFromAddress = resolveFromAddress();
            String safeFromName = resolveFromName();
            String formattedFrom = !safeFromAddress.contains("<")
                    ? safeFromName + " <" + safeFromAddress + ">"
                    : safeFromAddress;
            message.setFrom(formattedFrom);
            message.setTo(cleanTo);
            if (replyToEmail != null && !replyToEmail.isBlank()) {
                message.setReplyTo(sanitizeSingleLine(replyToEmail));
            }
            message.setSubject(cleanSubject);
            message.setText(body);
            mailSender.send(message);
            log.info("[EMAIL SERVICE] Successfully dispatched email via {} to {}", mailHost, cleanTo);
            return true;
        } catch (Exception e) {
            log.error("[EMAIL SERVICE] Failed to send email via {} to {}: {}", mailHost, cleanTo, e.getMessage());
            return false;
        }
    }

    private boolean sendViaWebhook(String to, String recipientName, String subject, String body, String replyToEmail, String replyToName) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("to", to);
        String cleanRecipientName = sanitizeSingleLine(recipientName);
        if (!cleanRecipientName.isBlank()) {
            payload.put("recipientName", cleanRecipientName);
        }
        payload.put("fromAddress", resolveFromAddress());
        payload.put("fromName", resolveFromName());
        payload.put("subject", subject);
        payload.put("body", body);
        if (mailWebhookSecret != null && !mailWebhookSecret.isBlank()) {
            payload.put("secret", mailWebhookSecret.trim());
        }

        String cleanReplyToEmail = sanitizeSingleLine(replyToEmail);
        if (!cleanReplyToEmail.isBlank()) {
            payload.put("replyTo", cleanReplyToEmail);
            String cleanReplyToName = sanitizeSingleLine(replyToName);
            if (!cleanReplyToName.isBlank()) {
                payload.put("replyToName", cleanReplyToName);
            }
        }

        HttpResponse<String> response = postJson(redirectHttpClient, mailWebhookUrl.trim(), Map.of(), payload, "mail webhook", to);
        if (response == null) {
            return false;
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            log.error("[EMAIL SERVICE] Failed to send email via mail webhook to {}: HTTP {} ({})",
                    to, response.statusCode(), sanitizeLogSnippet(response.body()));
            return false;
        }

        try {
            JsonNode root = objectMapper.readTree(response.body());
            if (root != null && root.path("ok").asBoolean(false)) {
                log.info("[EMAIL SERVICE] Successfully dispatched email via mail webhook to {} (HTTP {})", to, response.statusCode());
                return true;
            }
            String webhookError = root != null ? sanitizeLogSnippet(root.path("error").asText("")) : "";
            log.error("[EMAIL SERVICE] Mail webhook rejected dispatch to {}: {}",
                    to, webhookError.isBlank() ? sanitizeLogSnippet(response.body()) : webhookError);
            return false;
        } catch (Exception e) {
            // Non-JSON 200 responses (e.g., Google login HTML when Apps Script access is not set to "Anyone") must fail loudly
            log.error("[EMAIL SERVICE] Unexpected non-JSON response from mail webhook for {}: HTTP {} ({})",
                    to, response.statusCode(), sanitizeLogSnippet(response.body()));
            return false;
        }
    }

    private boolean sendViaBrevo(String to, String recipientName, String subject, String body, String replyToEmail, String replyToName) {
        String apiEndpoint = (brevoApiUrl != null && !brevoApiUrl.isBlank()) ? brevoApiUrl.trim() : DEFAULT_BREVO_API_URL;

        Map<String, Object> senderMap = new LinkedHashMap<>();
        senderMap.put("email", resolveFromAddress());
        senderMap.put("name", resolveFromName());

        Map<String, Object> toEntry = new LinkedHashMap<>();
        toEntry.put("email", to);
        String cleanRecipientName = sanitizeSingleLine(recipientName);
        if (!cleanRecipientName.isBlank()) {
            toEntry.put("name", cleanRecipientName);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sender", senderMap);
        payload.put("to", List.of(toEntry));
        payload.put("subject", subject);
        payload.put("textContent", body);

        String cleanReplyToEmail = sanitizeSingleLine(replyToEmail);
        if (!cleanReplyToEmail.isBlank()) {
            Map<String, Object> replyToMap = new LinkedHashMap<>();
            replyToMap.put("email", cleanReplyToEmail);
            String cleanReplyToName = sanitizeSingleLine(replyToName);
            if (!cleanReplyToName.isBlank()) {
                replyToMap.put("name", cleanReplyToName);
            }
            payload.put("replyTo", replyToMap);
        }

        HttpResponse<String> response = postJson(httpClient, apiEndpoint, Map.of("api-key", brevoApiKey.trim()), payload, "Brevo API", to);
        if (response == null) {
            return false;
        }
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("[EMAIL SERVICE] Successfully dispatched email via Brevo API to {} (HTTP {})", to, response.statusCode());
            return true;
        }

        log.error("[EMAIL SERVICE] Failed to send email via Brevo API to {}: HTTP {} ({})",
                to, response.statusCode(), sanitizeLogSnippet(response.body()));
        return false;
    }

    private HttpResponse<String> postJson(
            HttpClient client,
            String endpoint,
            Map<String, String> extraHeaders,
            Map<String, Object> payload,
            String transportLabel,
            String recipient
    ) {
        try {
            String jsonBody = objectMapper.writeValueAsString(payload);
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(15))
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8));
            extraHeaders.forEach(requestBuilder::header);

            return client.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("[EMAIL SERVICE] Interrupted while sending email via {} to {}", transportLabel, recipient);
            return null;
        } catch (Exception e) {
            log.error("[EMAIL SERVICE] Failed to send email via {} to {}: {}", transportLabel, recipient, e.getMessage());
            return null;
        }
    }
}

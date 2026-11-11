package com.medinex.common.web;

import com.medinex.common.api.ApiResponse;
import com.medinex.common.email.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Public Inquiries", description = "Public contact & collaboration endpoints")
public class PublicContactController {

    private final EmailService emailService;

    @PostMapping("/contact")
    @Operation(summary = "Send a public inquiry to the MediNex team")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> submitContactInquiry(
            @Valid @RequestBody ContactInquiryRequest request
    ) {
        boolean dispatched = emailService.sendContactInquiry(
                request.getName(),
                request.getEmail(),
                request.getCategory(),
                request.getSubject(),
                request.getMessage()
        );

        if (!dispatched) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiResponse.error(
                            "Unable to deliver your message right now. Please try again shortly.",
                            null
                    ));
        }

        return ResponseEntity.ok(
                ApiResponse.ok(Map.of("delivered", true), "Your message has been delivered to the MediNex team.")
        );
    }

    @Data
    public static class ContactInquiryRequest {
        @NotBlank(message = "Full name is required")
        @Size(max = 120)
        private String name;

        @NotBlank(message = "Email address is required")
        @Email(message = "Please enter a valid email address")
        @Size(max = 180)
        private String email;

        @NotBlank(message = "Category is required")
        @Size(max = 60)
        private String category;

        @NotBlank(message = "Subject is required")
        @Size(max = 200)
        private String subject;

        @NotBlank(message = "Message content is required")
        @Size(max = 4000)
        private String message;
    }
}

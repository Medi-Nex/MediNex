package com.medinex.config;

import com.medinex.common.exception.GlobalExceptionHandler;
import com.medinex.common.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.web.HttpRequestMethodNotSupportedException;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class ProductionConfigValidationTest {

    private static final String KNOWN_DEV_KEY =
            "4c56e297893a778c187e1451b5c2a13b4f59837651a2d48698ecb819f3900cb93ad9871f92e071e6d1f054817a1936c5";

    @Test
    @DisplayName("Production Profile: Rejects known repository dev JWT secret on startup")
    void rejectsKnownDevJwtSecretInProd() {
        MockEnvironment env = new MockEnvironment().withProperty("spring.profiles.active", "prod");
        env.setActiveProfiles("prod");

        assertThrows(IllegalStateException.class, () ->
                new JwtTokenProvider(KNOWN_DEV_KEY, 900000L, 604800000L, env)
        );
    }

    @Test
    @DisplayName("Production Profile: Rejects blank or short (<256-bit) JWT secret")
    void rejectsShortOrBlankJwtSecretInProd() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        assertThrows(IllegalStateException.class, () ->
                new JwtTokenProvider("", 900000L, 604800000L, env)
        );
        assertThrows(IllegalStateException.class, () ->
                new JwtTokenProvider("short-key", 900000L, 604800000L, env)
        );
    }

    @Test
    @DisplayName("Production Profile: Accepts strong 256-bit+ Base64 JWT secret")
    void acceptsStrongJwtSecretInProd() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        byte[] random64 = new byte[64];
        for (int i = 0; i < random64.length; i++) {
            random64[i] = (byte) (i + 17);
        }
        String strongSecret = Base64.getEncoder().encodeToString(random64);

        JwtTokenProvider provider = new JwtTokenProvider(strongSecret, 900000L, 604800000L, env);
        assertNotNull(provider);
    }

    @Test
    @DisplayName("Exception Handler: Returns 405 on unsupported HTTP method and hides internal details on 500")
    void returns405AndRedacted500() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        var methodRes = handler.handleMethodNotSupported(new HttpRequestMethodNotSupportedException("GET"));
        assertEquals(HttpStatus.METHOD_NOT_ALLOWED, methodRes.getStatusCode());

        var genericRes = handler.handleGenericException(new RuntimeException("jdbc:postgresql://secret-host:5432/db failed"));
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, genericRes.getStatusCode());
        assertNotNull(genericRes.getBody());
        assertFalse(genericRes.getBody().getMessage().contains("secret-host"));
    }
}

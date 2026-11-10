package com.medinex;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class MediNexApplicationTests {

    @Test
    void contextLoads() {
        // Confirms Spring application context initializes cleanly with test profile
    }
}

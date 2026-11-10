package com.medinex.common.security;

import com.medinex.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service enforcing Zero-PHI (Protected Health Information) compliance.
 * In accordance with MediNex healthcare data governance rules, no patient medical records,
 * clinical diagnostics, or identifiable health records are permitted in the public community database.
 */
@Service
@Slf4j
public class PhiGuardService {

    // Regex patterns targeting common PHI and clinical diagnostic records
    private static final Pattern[] PHI_PATTERNS = new Pattern[] {
            // Medical Record Numbers & Hospital Patient Identifiers
            Pattern.compile("(?i)\\b(?:MRN|Medical\\s*Record\\s*(?:Number|No)|Patient\\s*(?:ID|Number|No)|Hospital\\s*(?:ID|Number)|Clinic\\s*ID)\\s*[:#=\\-]?\\s*[A-Z0-9-]{4,}\\b"),

            // Clinical Prescription details with dosages
            Pattern.compile("(?i)\\b(?:Rx|Prescription\\s*for)\\s*[:#\\-]?\\s*[A-Za-z0-9\\s]{2,}\\s*(?:\\d+\\s*(?:mg|ml|mcg|tablets|capsules|daily|bid|tid|qid))\\b"),

            // Diagnostic Admissions & Clinical Discharge summaries
            Pattern.compile("(?i)\\b(?:Chief\\s*Complaint|Discharge\\s*Summary|Clinical\\s*Admission|Diagnostic\\s*Impression|ICD-(?:9|10|11))\\s*[:=]\\s*[^\\n\\r]{4,}"),

            // Explicit Patient Name with demographic pairing
            Pattern.compile("(?i)\\bPatient\\s*Name\\s*:\\s*[A-Z][a-z]+\\s+[A-Z][a-z]+\\b"),

            // Date of birth paired with medical context
            Pattern.compile("(?i)\\b(?:Patient\\s*DOB|DOB\\s*of\\s*Patient|Date\\s*of\\s*Birth\\s*of\\s*Patient)\\s*[:=]?\\s*(?:\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{2,4})\\b"),

            // Patient National ID / SSN identifiers
            Pattern.compile("(?i)\\b(?:Patient\\s*SSN|Patient\\s*NID)\\s*[:#\\-]?\\s*[\\d-]{9,}\\b")
    };

    /**
     * Checks if the given text contains any potential PHI patterns.
     *
     * @param text content to evaluate
     * @return true if PHI is detected, false otherwise
     */
    public boolean containsPhi(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        for (Pattern pattern : PHI_PATTERNS) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                log.warn("[PHI_GUARD] Detected potential PHI violation matching pattern: {}", pattern.pattern());
                return true;
            }
        }
        return false;
    }

    /**
     * Validates that the provided text is free of Protected Health Information.
     * Throws BadRequestException if any violation is detected.
     *
     * @param text content to validate
     * @throws BadRequestException if PHI is detected
     */
    public void validateContent(String text) {
        if (text == null || text.trim().isEmpty()) {
            return;
        }

        for (Pattern pattern : PHI_PATTERNS) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String matchedSnippet = matcher.group();
                if (matchedSnippet.length() > 25) {
                    matchedSnippet = matchedSnippet.substring(0, 22) + "...";
                }
                log.warn("[PHI_GUARD] Blocking submission containing PHI snippet: {}", matchedSnippet);
                throw new BadRequestException(
                        "Zero-PHI Policy Violation: Detected potential Protected Health Information (PHI) or clinical diagnostic records (\"" +
                                matchedSnippet + "\"). In accordance with MediNex healthcare data governance rules, posting patient medical records, clinical identifiers, or personal diagnostic data in the public community is strictly prohibited."
                );
            }
        }
    }
}

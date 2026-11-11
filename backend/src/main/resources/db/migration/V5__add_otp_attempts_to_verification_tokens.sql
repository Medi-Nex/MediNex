-- ==============================================================================
-- MEDINEX DATABASE SCHEMA MIGRATION V5
-- Tracks failed verification attempts on email_verification_tokens to enforce
-- brute-force lockout for 6-digit numeric OTP codes.
-- Forward-only, idempotent, preserves all existing rows.
-- ==============================================================================

ALTER TABLE email_verification_tokens
    ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;

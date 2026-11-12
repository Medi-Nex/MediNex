-- ==============================================================================
-- MEDINEX DATABASE SCHEMA MIGRATION V7
-- Tracks failed attempts on password_reset_tokens to enforce brute-force lockout
-- for 6-digit numeric password reset OTP codes.
-- Forward-only, idempotent, preserves all existing rows.
-- ==============================================================================

ALTER TABLE password_reset_tokens
    ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;

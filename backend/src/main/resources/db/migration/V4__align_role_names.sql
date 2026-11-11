-- ==============================================================================
-- MEDINEX DATABASE SCHEMA MIGRATION V4
-- Aligns roles.name with RoleType Spring Security authority identifiers
-- ('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER').
-- V1 seeded human-readable display labels in roles.name while application
-- code, JWT claims, UserPrincipal, and the frontend expect ROLE_* names.
-- Forward-only, idempotent, preserves roles.id PK and all user_roles FKs.
-- ==============================================================================

INSERT INTO roles (id, name, description) VALUES
    ('ROLE_SUPER_ADMIN', 'ROLE_SUPER_ADMIN', 'Full administrative authority across all modules'),
    ('ROLE_ADMIN', 'ROLE_ADMIN', 'Administrative authority for team, projects, and moderation'),
    ('ROLE_MODERATOR', 'ROLE_MODERATOR', 'Content moderation and report resolution'),
    ('ROLE_USER', 'ROLE_USER', 'Standard registered community contributor or member')
ON CONFLICT (id) DO NOTHING;

UPDATE roles
SET name = id
WHERE id IN ('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_MODERATOR', 'ROLE_USER')
  AND name <> id;

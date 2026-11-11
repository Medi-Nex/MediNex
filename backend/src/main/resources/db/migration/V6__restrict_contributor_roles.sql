-- ==============================================================================
-- MEDINEX DATABASE SCHEMA MIGRATION V6
-- Least-privilege hardening: removes default ROLE_ADMIN / ROLE_SUPER_ADMIN
-- privileges from seeded contributor accounts (contributor-01..06) while
-- preserving ROLE_USER, profiles, team assignments, and medinex-admin access.
-- Forward-only, idempotent, zero data deletion of user entities.
-- ==============================================================================

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 'ROLE_USER'
FROM users u
WHERE u.username IN (
    'contributor-01',
    'contributor-02',
    'contributor-03',
    'contributor-04',
    'contributor-05',
    'contributor-06'
)
ON CONFLICT DO NOTHING;

DELETE FROM user_roles ur
USING users u
WHERE ur.user_id = u.id
  AND u.username IN (
      'contributor-01',
      'contributor-02',
      'contributor-03',
      'contributor-04',
      'contributor-05',
      'contributor-06'
  )
  AND ur.role_id IN ('ROLE_ADMIN', 'ROLE_SUPER_ADMIN');

-- ==============================================================================
-- MEDINEX DATABASE SCHEMA MIGRATION V3 - COLLECTION TABLE ALIGNMENT
-- Target Database: PostgreSQL 16+
-- Forward-only migration aligning JPA @ElementCollection mappings with schema.
-- Preserves all existing data; performs non-destructive schema alignment.
-- ==============================================================================

-- 1. Align project_tech_stack column name with Project.techStack (@Column(name = "technology"))
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'project_tech_stack'
          AND column_name = 'tech'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'project_tech_stack'
          AND column_name = 'technology'
    ) THEN
        ALTER TABLE project_tech_stack RENAME COLUMN tech TO technology;
    END IF;
END $$;

-- 2. Create user_profile_skills collection table for UserProfile.skills
CREATE TABLE IF NOT EXISTS user_profile_skills (
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skill VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profile_skills_profile_id
    ON user_profile_skills (profile_id);

-- Backfill any existing array values from user_profiles.skills without duplicates
INSERT INTO user_profile_skills (profile_id, skill)
SELECT up.id, s.val
FROM user_profiles up
CROSS JOIN LATERAL unnest(up.skills) AS s(val)
WHERE up.skills IS NOT NULL
  AND array_length(up.skills, 1) > 0
  AND NOT EXISTS (
      SELECT 1 FROM user_profile_skills ups
      WHERE ups.profile_id = up.id AND ups.skill = s.val
  );

-- 3. Create user_profile_responsibilities collection table for UserProfile.responsibilities
CREATE TABLE IF NOT EXISTS user_profile_responsibilities (
    profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    responsibility VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profile_responsibilities_profile_id
    ON user_profile_responsibilities (profile_id);

-- Backfill any existing array values from user_profiles.responsibilities without duplicates
INSERT INTO user_profile_responsibilities (profile_id, responsibility)
SELECT up.id, r.val
FROM user_profiles up
CROSS JOIN LATERAL unnest(up.responsibilities) AS r(val)
WHERE up.responsibilities IS NOT NULL
  AND array_length(up.responsibilities, 1) > 0
  AND NOT EXISTS (
      SELECT 1 FROM user_profile_responsibilities upr
      WHERE upr.profile_id = up.id AND upr.responsibility = r.val
  );

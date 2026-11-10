-- ==============================================================================
-- MEDINEX DATABASE SCHEMA MIGRATION V2 - PERFORMANCE INDEXING & HARDENING
-- Target Database: PostgreSQL 16+
-- Optimizes high-throughput community feed pagination, search, and follower graphs
-- ==============================================================================

-- 1. Partial index for public community feed queries
-- Optimizes: WHERE is_hidden = FALSE AND deleted_at IS NULL AND visibility = 'PUBLIC' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_posts_public_feed
    ON posts (created_at DESC)
    WHERE is_hidden = FALSE AND deleted_at IS NULL AND visibility = 'PUBLIC';

-- 2. Author post listing optimization (for user profile post tabs and feeds)
CREATE INDEX IF NOT EXISTS idx_posts_author_active
    ON posts (author_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- 3. Comments hierarchical tree traversal optimization
CREATE INDEX IF NOT EXISTS idx_comments_post_tree
    ON comments (post_id, parent_comment_id, created_at ASC)
    WHERE is_hidden = FALSE AND deleted_at IS NULL;

-- 4. Follower counts and list queries optimization
CREATE INDEX IF NOT EXISTS idx_team_follows_team_created
    ON team_follows (team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_following_created
    ON user_follows (following_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_created
    ON user_follows (follower_id, created_at DESC);

-- 5. Notifications lookup by recipient and read state
CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications (recipient_id, created_at DESC)
    WHERE is_read = FALSE;

-- 6. Announcements publication ordering
CREATE INDEX IF NOT EXISTS idx_announcements_published
    ON announcements (published_at DESC)
    WHERE is_published = TRUE;

-- 7. Events schedule ordering
CREATE INDEX IF NOT EXISTS idx_events_date
    ON events (event_date ASC, status);

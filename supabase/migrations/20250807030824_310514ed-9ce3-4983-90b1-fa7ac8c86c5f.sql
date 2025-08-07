
-- Drop any remaining meeting-related columns from deals table
ALTER TABLE deals DROP COLUMN IF EXISTS related_meeting_id;

-- Check for and drop any unused indexes related to meetings
DROP INDEX IF EXISTS idx_meetings_date;
DROP INDEX IF EXISTS idx_meetings_user_id;
DROP INDEX IF EXISTS idx_meeting_outcomes_meeting_id;

-- Clean up any remaining functions that might reference meetings
DROP FUNCTION IF EXISTS get_meeting_stats();
DROP FUNCTION IF EXISTS update_meeting_status();

-- Remove any triggers related to meetings
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
DROP TRIGGER IF EXISTS update_meeting_outcomes_updated_at ON meeting_outcomes;

-- Clean up any views that might reference meetings
DROP VIEW IF EXISTS meeting_summary;
DROP VIEW IF EXISTS daily_meetings;

-- Ensure no orphaned data remains in related tables
-- (This is already done since tables were dropped, but good to be explicit)

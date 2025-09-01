-- Remove the generated duration column since it's causing conflicts
-- We'll calculate duration in the application instead
ALTER TABLE meetings DROP COLUMN IF EXISTS duration;

-- Drop the meeting_outcomes table first (due to foreign key dependency)
DROP TABLE IF EXISTS public.meeting_outcomes CASCADE;

-- Drop the meetings table
DROP TABLE IF EXISTS public.meetings CASCADE;


-- Add timezone column to the meetings table
ALTER TABLE public.meetings 
ADD COLUMN timezone text DEFAULT 'UTC+00:00';

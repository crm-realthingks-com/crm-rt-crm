-- Update meetings table to match requirements
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS start_time_utc TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time_utc TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS time_zone TEXT,
ADD COLUMN IF NOT EXISTS microsoft_event_id TEXT;

-- Update existing data to use new columns
UPDATE public.meetings 
SET 
  start_time_utc = start_datetime,
  end_time_utc = end_datetime,
  duration = EXTRACT(EPOCH FROM (end_datetime - start_datetime)) / 60,
  time_zone = COALESCE(timezone, 'UTC'),
  microsoft_event_id = teams_meeting_id
WHERE start_time_utc IS NULL;

-- Add constraints and indexes
CREATE INDEX IF NOT EXISTS idx_meetings_start_time_utc ON public.meetings (start_time_utc);
CREATE INDEX IF NOT EXISTS idx_meetings_time_zone ON public.meetings (time_zone);
CREATE INDEX IF NOT EXISTS idx_meetings_microsoft_event_id ON public.meetings (microsoft_event_id);

-- Add trigger to auto-calculate duration when times are updated
CREATE OR REPLACE FUNCTION update_meeting_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_time_utc IS NOT NULL AND NEW.end_time_utc IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time_utc - NEW.start_time_utc)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meeting_duration
  BEFORE INSERT OR UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_duration();
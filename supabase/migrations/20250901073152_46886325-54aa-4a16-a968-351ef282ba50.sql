-- Clean up meetings table structure and fix timezone handling
-- Remove duplicate and unnecessary fields, standardize on proper UTC storage

-- Remove the old datetime columns and unused fields
ALTER TABLE meetings DROP COLUMN IF EXISTS start_datetime;
ALTER TABLE meetings DROP COLUMN IF EXISTS end_datetime;
ALTER TABLE meetings DROP COLUMN IF EXISTS timezone;

-- Add time_zone_display field if not exists
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS time_zone_display TEXT;

-- Ensure all required fields exist with proper types
ALTER TABLE meetings ALTER COLUMN start_time_utc SET NOT NULL;
ALTER TABLE meetings ALTER COLUMN end_time_utc SET NOT NULL;
ALTER TABLE meetings ALTER COLUMN time_zone SET NOT NULL;

-- Update the duration calculation trigger to use the new UTC fields
DROP TRIGGER IF EXISTS update_meeting_duration_trigger ON meetings;

CREATE OR REPLACE FUNCTION public.update_meeting_duration()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.start_time_utc IS NOT NULL AND NEW.end_time_utc IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time_utc - NEW.start_time_utc)) / 60;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_meeting_duration_trigger
  BEFORE INSERT OR UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_duration();

-- Add function to format timezone display
CREATE OR REPLACE FUNCTION public.format_timezone_display(iana_timezone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
DECLARE
  timezone_offset TEXT;
  timezone_abbr TEXT;
BEGIN
  -- Get timezone offset and abbreviation for current timestamp
  SELECT 
    to_char(now() AT TIME ZONE iana_timezone, 'OF') as offset,
    to_char(now() AT TIME ZONE iana_timezone, 'TZ') as abbr
  INTO timezone_offset, timezone_abbr;
  
  -- Format as UTC±HH:MM (ABBR)
  RETURN 'UTC' || timezone_offset || ' (' || timezone_abbr || ')';
EXCEPTION
  WHEN OTHERS THEN
    RETURN iana_timezone;
END;
$function$;
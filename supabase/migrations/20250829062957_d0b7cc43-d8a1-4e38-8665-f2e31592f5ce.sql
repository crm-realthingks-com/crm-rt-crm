
-- Create meetings table with comprehensive fields
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER, -- in minutes
  participants TEXT[] NOT NULL DEFAULT '{}', -- array of email addresses
  organizer UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  teams_meeting_link TEXT,
  teams_meeting_id TEXT, -- Microsoft Teams meeting ID for API operations
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  modified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for meetings table
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Users can create meetings
CREATE POLICY "Users can create meetings" 
  ON public.meetings 
  FOR INSERT 
  WITH CHECK ((auth.uid() = organizer) AND (auth.uid() = created_by));

-- Users can view meetings they organize or participate in
CREATE POLICY "Users can view meetings they organize or participate in" 
  ON public.meetings 
  FOR SELECT 
  USING ((auth.uid() = organizer) OR ((auth.uid())::text IN (SELECT unnest(meetings.participants))) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])));

-- Users can update meetings they organize
CREATE POLICY "Users can update meetings they organize" 
  ON public.meetings 
  FOR UPDATE 
  USING ((auth.uid() = organizer) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])));

-- Users can delete meetings they organize
CREATE POLICY "Users can delete meetings they organize" 
  ON public.meetings 
  FOR DELETE 
  USING ((auth.uid() = organizer) OR (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])));

-- Add trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meetings_updated_at_trigger
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_meetings_updated_at();

-- Add validation trigger for meeting dates
CREATE OR REPLACE FUNCTION validate_meeting_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate start_datetime is not in the past (allow some buffer for editing)
  IF NEW.start_datetime < NOW() - INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Meeting start time cannot be in the past';
  END IF;
  
  -- Validate end_datetime is after start_datetime
  IF NEW.end_datetime <= NEW.start_datetime THEN
    RAISE EXCEPTION 'Meeting end time must be after start time';
  END IF;
  
  -- Calculate duration in minutes
  NEW.duration = EXTRACT(EPOCH FROM (NEW.end_datetime - NEW.start_datetime)) / 60;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_meeting_dates_trigger
  BEFORE INSERT OR UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION validate_meeting_dates();

-- Create table for meeting reminders
CREATE TABLE public.meeting_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24_hours', '15_minutes')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS for meeting reminders
ALTER TABLE public.meeting_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage meeting reminders" 
  ON public.meeting_reminders 
  FOR ALL 
  USING (true);

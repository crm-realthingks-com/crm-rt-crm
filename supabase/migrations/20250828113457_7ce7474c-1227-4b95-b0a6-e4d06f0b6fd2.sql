-- Create meetings table with all required fields
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_datetime - start_datetime))/60) STORED,
  participants TEXT[] NOT NULL DEFAULT '{}',
  organizer UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  teams_meeting_link TEXT,
  teams_meeting_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  modified_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meetings table
-- All authenticated users can view meetings they are organizer or participants
CREATE POLICY "Users can view meetings they organize or participate in"
ON public.meetings
FOR SELECT
USING (
  auth.uid() = organizer OR
  auth.uid()::text = ANY(
    SELECT unnest(participants)
  ) OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text])
);

-- All authenticated users can create meetings
CREATE POLICY "Users can create meetings"
ON public.meetings
FOR INSERT
WITH CHECK (
  auth.uid() = organizer AND
  auth.uid() = created_by
);

-- Users can update meetings they organize, admin/manager can update all
CREATE POLICY "Users can update meetings they organize"
ON public.meetings
FOR UPDATE
USING (
  auth.uid() = organizer OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text])
);

-- Users can delete meetings they organize, admin/manager can delete all
CREATE POLICY "Users can delete meetings they organize"
ON public.meetings
FOR DELETE
USING (
  auth.uid() = organizer OR
  get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text])
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_meetings_organizer ON public.meetings(organizer);
CREATE INDEX idx_meetings_start_datetime ON public.meetings(start_datetime);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_participants ON public.meetings USING GIN(participants);
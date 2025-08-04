
-- Create meetings table
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  status TEXT DEFAULT 'Scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create meeting_outcomes table
CREATE TABLE public.meeting_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL,
  outcome_type TEXT NOT NULL,
  summary TEXT,
  next_steps TEXT,
  interested_in_deal BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on meetings table
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meetings
CREATE POLICY "Users can view own meetings" 
  ON public.meetings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meetings" 
  ON public.meetings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings" 
  ON public.meetings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings" 
  ON public.meetings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on meeting_outcomes table
ALTER TABLE public.meeting_outcomes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meeting_outcomes
CREATE POLICY "Users can view meeting outcomes for their meetings" 
  ON public.meeting_outcomes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_outcomes.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create meeting outcomes for their meetings" 
  ON public.meeting_outcomes 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_outcomes.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update meeting outcomes for their meetings" 
  ON public.meeting_outcomes 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_outcomes.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete meeting outcomes for their meetings" 
  ON public.meeting_outcomes 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_outcomes.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

-- Add foreign key constraint
ALTER TABLE public.meeting_outcomes 
ADD CONSTRAINT fk_meeting_outcomes_meeting_id 
FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;

-- Add triggers for updated_at
CREATE TRIGGER update_meetings_updated_at 
  BEFORE UPDATE ON public.meetings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_outcomes_updated_at 
  BEFORE UPDATE ON public.meeting_outcomes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

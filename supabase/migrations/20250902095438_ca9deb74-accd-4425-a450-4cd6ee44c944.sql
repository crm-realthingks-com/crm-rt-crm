-- Create meeting_action_items table
CREATE TABLE public.meeting_action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL,
  next_action TEXT NOT NULL,
  assigned_to UUID,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Ongoing', 'Closed')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meeting_action_items ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting action items - Allow users to manage action items for meetings they organize or participate in
CREATE POLICY "Users can view meeting action items for their meetings" 
ON public.meeting_action_items 
FOR SELECT 
USING (
  meeting_id IN (
    SELECT id FROM meetings 
    WHERE organizer = auth.uid() 
    OR auth.uid()::text = ANY(participants)
    OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])
  )
);

CREATE POLICY "Users can create meeting action items for their meetings" 
ON public.meeting_action_items 
FOR INSERT 
WITH CHECK (
  meeting_id IN (
    SELECT id FROM meetings 
    WHERE organizer = auth.uid() 
    OR auth.uid()::text = ANY(participants)
    OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update meeting action items for their meetings" 
ON public.meeting_action_items 
FOR UPDATE 
USING (
  meeting_id IN (
    SELECT id FROM meetings 
    WHERE organizer = auth.uid() 
    OR auth.uid()::text = ANY(participants)
    OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])
  )
);

CREATE POLICY "Users can delete meeting action items for their meetings" 
ON public.meeting_action_items 
FOR DELETE 
USING (
  meeting_id IN (
    SELECT id FROM meetings 
    WHERE organizer = auth.uid() 
    OR auth.uid()::text = ANY(participants)
    OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meeting_action_items_updated_at
BEFORE UPDATE ON public.meeting_action_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification trigger for meeting action items (similar to lead action items)
CREATE OR REPLACE FUNCTION public.create_meeting_action_item_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  meeting_title TEXT;
  assignee_id UUID;
  creator_id UUID;
  message_text TEXT;
  notification_type TEXT := 'action_item';
BEGIN
  -- Get meeting title
  SELECT meetings.title INTO meeting_title
  FROM meetings
  WHERE meetings.id = COALESCE(NEW.meeting_id, OLD.meeting_id);

  -- Determine the message and who to notify based on the operation
  IF TG_OP = 'INSERT' THEN
    message_text := 'New action item added for meeting: ' || COALESCE(meeting_title, 'Unknown Meeting');
    assignee_id := NEW.assigned_to;
    creator_id := NEW.created_by;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check if status changed to Closed
    IF OLD.status != NEW.status AND NEW.status = 'Closed' THEN
      message_text := 'Action item closed for meeting: ' || COALESCE(meeting_title, 'Unknown Meeting');
    ELSE
      message_text := 'Action item updated for meeting: ' || COALESCE(meeting_title, 'Unknown Meeting');
    END IF;
    assignee_id := NEW.assigned_to;
    creator_id := NEW.created_by;
  ELSIF TG_OP = 'DELETE' THEN
    message_text := 'Action item deleted for meeting: ' || COALESCE(meeting_title, 'Unknown Meeting');
    assignee_id := OLD.assigned_to;
    creator_id := OLD.created_by;
  END IF;

  -- Only create notification for the assignee if they exist and are different from the person making the change
  IF assignee_id IS NOT NULL AND assignee_id != auth.uid() THEN
    INSERT INTO public.notifications (
      user_id,
      message,
      notification_type
    ) VALUES (
      assignee_id,
      message_text,
      notification_type
    );
  END IF;

  -- Only notify the creator if they are different from both the assignee and the person making the change
  IF creator_id IS NOT NULL 
     AND creator_id != assignee_id 
     AND creator_id != auth.uid() THEN
    INSERT INTO public.notifications (
      user_id,
      message,
      notification_type
    ) VALUES (
      creator_id,
      message_text,
      notification_type
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for meeting action item notifications
CREATE TRIGGER meeting_action_item_notification_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.meeting_action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.create_meeting_action_item_notification();
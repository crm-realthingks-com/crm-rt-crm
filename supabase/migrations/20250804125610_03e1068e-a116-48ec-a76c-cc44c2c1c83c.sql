
-- First, let's check and fix the contacts table structure
ALTER TABLE public.contacts 
RENAME COLUMN company TO company_name;

ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS phone_no text,
ADD COLUMN IF NOT EXISTS mobile_no text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS no_of_employees integer,
ADD COLUMN IF NOT EXISTS annual_revenue numeric,
ADD COLUMN IF NOT EXISTS contact_source text,
ADD COLUMN IF NOT EXISTS modified_time timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS modified_by uuid;

-- Rename existing columns to match app expectations
ALTER TABLE public.contacts 
RENAME COLUMN phone TO phone_no;

ALTER TABLE public.contacts 
RENAME COLUMN source TO contact_source;

ALTER TABLE public.contacts 
RENAME COLUMN region TO country;

-- Fix the leads table to match app expectations
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS mobile_no text,
ADD COLUMN IF NOT EXISTS no_of_employees integer,
ADD COLUMN IF NOT EXISTS annual_revenue numeric,
ADD COLUMN IF NOT EXISTS contact_source text,
ADD COLUMN IF NOT EXISTS lead_status text DEFAULT 'New',
ADD COLUMN IF NOT EXISTS modified_time timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS modified_by uuid;

-- Rename existing columns in leads table
ALTER TABLE public.leads 
RENAME COLUMN source TO contact_source;

ALTER TABLE public.leads 
RENAME COLUMN region TO country;

-- Create meetings table that the app expects
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  location text,
  participants text[],
  tags text[],
  follow_up_required boolean DEFAULT false,
  outcome text,
  action_items text,
  status text DEFAULT 'Scheduled',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  modified_by uuid
);

-- Enable RLS for meetings table
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meetings
CREATE POLICY "Users can view their own meetings" 
  ON public.meetings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meetings" 
  ON public.meetings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings" 
  ON public.meetings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings" 
  ON public.meetings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Now let's fix the deals table to match the app's stage-based structure
-- First, let's see what columns we need for deals based on the app code

-- Add missing columns to deals table
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS deal_name text NOT NULL DEFAULT 'Untitled Deal',
ADD COLUMN IF NOT EXISTS project_name text,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS priority integer CHECK (priority >= 1 AND priority <= 5),
ADD COLUMN IF NOT EXISTS probability integer CHECK (probability >= 0 AND probability <= 100),
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS internal_comment text,
ADD COLUMN IF NOT EXISTS expected_closing_date date,
ADD COLUMN IF NOT EXISTS customer_need text,
ADD COLUMN IF NOT EXISTS customer_challenges text CHECK (customer_challenges IN ('Open', 'Ongoing', 'Done')),
ADD COLUMN IF NOT EXISTS relationship_strength text CHECK (relationship_strength IN ('Low', 'Medium', 'High')),
ADD COLUMN IF NOT EXISTS business_value text CHECK (business_value IN ('Open', 'Ongoing', 'Done')),
ADD COLUMN IF NOT EXISTS decision_maker_level text CHECK (decision_maker_level IN ('Open', 'Ongoing', 'Done')),
ADD COLUMN IF NOT EXISTS is_recurring text CHECK (is_recurring IN ('Yes', 'No', 'Unclear')),
ADD COLUMN IF NOT EXISTS total_contract_value numeric,
ADD COLUMN IF NOT EXISTS currency_type text CHECK (currency_type IN ('EUR', 'USD', 'INR')) DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS project_duration integer,
ADD COLUMN IF NOT EXISTS action_items text,
ADD COLUMN IF NOT EXISTS rfq_received_date date,
ADD COLUMN IF NOT EXISTS proposal_due_date date,
ADD COLUMN IF NOT EXISTS rfq_status text CHECK (rfq_status IN ('Drafted', 'Submitted', 'Rejected', 'Accepted')),
ADD COLUMN IF NOT EXISTS current_status text,
ADD COLUMN IF NOT EXISTS closing text,
ADD COLUMN IF NOT EXISTS won_reason text,
ADD COLUMN IF NOT EXISTS quarterly_revenue_q1 numeric,
ADD COLUMN IF NOT EXISTS quarterly_revenue_q2 numeric,
ADD COLUMN IF NOT EXISTS quarterly_revenue_q3 numeric,
ADD COLUMN IF NOT EXISTS quarterly_revenue_q4 numeric,
ADD COLUMN IF NOT EXISTS total_revenue numeric,
ADD COLUMN IF NOT EXISTS signed_contract_date date,
ADD COLUMN IF NOT EXISTS implementation_start_date date,
ADD COLUMN IF NOT EXISTS handoff_status text CHECK (handoff_status IN ('Not Started', 'In Progress', 'Complete')),
ADD COLUMN IF NOT EXISTS lost_reason text,
ADD COLUMN IF NOT EXISTS need_improvement text,
ADD COLUMN IF NOT EXISTS drop_reason text,
ADD COLUMN IF NOT EXISTS modified_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS modified_by uuid;

-- Update the stage enum to match what the app expects
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_stage_new') THEN
        CREATE TYPE deal_stage_new AS ENUM ('Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped');
        ALTER TABLE public.deals ADD COLUMN stage_new deal_stage_new DEFAULT 'Lead';
        UPDATE public.deals SET stage_new = 'Lead'::deal_stage_new WHERE stage::text = 'lead';
        UPDATE public.deals SET stage_new = 'Won'::deal_stage_new WHERE stage::text = 'won';
        UPDATE public.deals SET stage_new = 'Lost'::deal_stage_new WHERE stage::text = 'lost';
        ALTER TABLE public.deals DROP COLUMN stage;
        ALTER TABLE public.deals RENAME COLUMN stage_new TO stage;
        DROP TYPE IF EXISTS deal_stage;
        ALTER TYPE deal_stage_new RENAME TO deal_stage;
    END IF;
END $$;

-- Add triggers to update the modified_at timestamp
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables that need it
DROP TRIGGER IF EXISTS update_contacts_modified_at ON public.contacts;
CREATE TRIGGER update_contacts_modified_at 
    BEFORE UPDATE ON public.contacts 
    FOR EACH ROW EXECUTE FUNCTION update_modified_at_column();

DROP TRIGGER IF EXISTS update_deals_modified_at ON public.deals;
CREATE TRIGGER update_deals_modified_at 
    BEFORE UPDATE ON public.deals 
    FOR EACH ROW EXECUTE FUNCTION update_modified_at_column();

DROP TRIGGER IF EXISTS update_leads_modified_at ON public.leads;
CREATE TRIGGER update_leads_modified_at 
    BEFORE UPDATE ON public.leads 
    FOR EACH ROW EXECUTE FUNCTION update_modified_at_column();

DROP TRIGGER IF EXISTS update_meetings_modified_at ON public.meetings;
CREATE TRIGGER update_meetings_modified_at 
    BEFORE UPDATE ON public.meetings 
    FOR EACH ROW EXECUTE FUNCTION update_modified_at_column();

-- Enable realtime for all tables
ALTER TABLE public.contacts REPLICA IDENTITY FULL;
ALTER TABLE public.deals REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.meetings REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

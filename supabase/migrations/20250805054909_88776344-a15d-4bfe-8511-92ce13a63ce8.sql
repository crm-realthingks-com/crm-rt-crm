
-- First, let's add the missing fields to the deals table that are expected by the code

-- Add missing basic deal fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS priority INTEGER CHECK (priority >= 1 AND priority <= 5);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS probability INTEGER CHECK (probability >= 0 AND probability <= 100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS internal_comment TEXT;

-- Add missing discussions stage fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS customer_need TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS customer_challenges TEXT CHECK (customer_challenges IN ('Open', 'Ongoing', 'Done'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS relationship_strength TEXT CHECK (relationship_strength IN ('Low', 'Medium', 'High'));

-- Add missing qualified stage fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS business_value TEXT CHECK (business_value IN ('Open', 'Ongoing', 'Done'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS decision_maker_level TEXT CHECK (decision_maker_level IN ('Open', 'Ongoing', 'Done'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_recurring TEXT CHECK (is_recurring IN ('Yes', 'No', 'Unclear'));

-- Add missing RFQ stage fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS currency_type TEXT CHECK (currency_type IN ('EUR', 'USD', 'INR'));
ALTER TABLE deals ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS project_duration INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS action_items TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rfq_received_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS proposal_due_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rfq_status TEXT CHECK (rfq_status IN ('Drafted', 'Submitted', 'Rejected', 'Accepted'));

-- Add missing offered stage fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS current_status TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS closing TEXT;

-- Add missing won stage fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS won_reason TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS implementation_start_date DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS handoff_status TEXT CHECK (handoff_status IN ('Not Started', 'In Progress', 'Complete'));

-- Add missing lost/dropped stage fields
ALTER TABLE deals ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS need_improvement TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS drop_reason TEXT;

-- Add missing system fields that code expects
ALTER TABLE deals ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS modified_by UUID;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update the deal_stage enum to include all stages expected by the code
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_stage') THEN
        CREATE TYPE deal_stage AS ENUM ('Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped');
    ELSE
        -- Add any missing enum values
        BEGIN
            ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Discussions';
            ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Qualified';
            ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'RFQ';
            ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Offered';
            ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Won';
            ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Lost';
            ALTER TYPE deal_stage ADD VALUE IF NOT EXISTS 'Dropped';
        EXCEPTION
            WHEN duplicate_object THEN
                NULL; -- Ignore if values already exist
        END;
    END IF;
END$$;

-- Fix any column name mismatches
-- The code expects 'phone_no' but if the table has 'phone', we need to add phone_no
ALTER TABLE deals ADD COLUMN IF NOT EXISTS mobile_no TEXT;

-- Add missing contact source enum for deals if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_source') THEN
        CREATE TYPE contact_source AS ENUM ('Website', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Trade Show', 'Other');
    END IF;
END$$;

-- Add missing fields for contacts table that code expects
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_no TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS mobile_no TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS no_of_employees INTEGER;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_source contact_source DEFAULT 'Other';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_status TEXT;

-- Rename 'company' to 'company_name' if it exists and company_name doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'company') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'company_name') THEN
        ALTER TABLE contacts RENAME COLUMN company TO company_name;
    END IF;
END$$;

-- Rename 'phone' to 'phone_no' if it exists and phone_no doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'phone') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'phone_no') THEN
        ALTER TABLE contacts RENAME COLUMN phone TO phone_no;
    END IF;
END$$;

-- Add missing fields for leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS mobile_no TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_source contact_source DEFAULT 'Other';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS no_of_employees INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country TEXT;

-- Add missing fields for meetings table that code expects
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS agenda TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS participants TEXT[];
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS teams_link TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS deal_id UUID;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS host TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS created_by UUID;

-- Update triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_modified_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for deals table if they don't exist
DROP TRIGGER IF EXISTS update_deals_modified_at ON deals;
CREATE TRIGGER update_deals_modified_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_at_column();

-- Add triggers for contacts table if they don't exist
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for leads table if they don't exist
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for meetings table if they don't exist
DROP TRIGGER IF EXISTS update_meetings_updated_at ON meetings;
CREATE TRIGGER update_meetings_updated_at
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

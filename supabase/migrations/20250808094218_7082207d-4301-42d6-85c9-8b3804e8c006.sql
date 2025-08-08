
-- Remove the mobile_no column from the leads table
ALTER TABLE public.leads DROP COLUMN IF EXISTS mobile_no;

-- Add the status column to the leads table
ALTER TABLE public.leads ADD COLUMN status TEXT DEFAULT 'New';

-- Update the phone_no column to be just phone_no (removing mobile_no references)
COMMENT ON COLUMN public.leads.phone_no IS 'Phone number field for leads';

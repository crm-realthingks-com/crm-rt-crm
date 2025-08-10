
-- Drop lead_status and country columns from leads table
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS lead_status,
DROP COLUMN IF EXISTS country;


-- Add region column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN region text DEFAULT 'EU';

-- Add region column to leads table  
ALTER TABLE public.leads
ADD COLUMN region text DEFAULT 'EU';

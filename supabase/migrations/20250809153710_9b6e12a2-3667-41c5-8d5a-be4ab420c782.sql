
-- Remove unused fields from contacts table
ALTER TABLE public.contacts DROP COLUMN IF EXISTS country;
ALTER TABLE public.contacts DROP COLUMN IF EXISTS created_time;
ALTER TABLE public.contacts DROP COLUMN IF EXISTS modified_time;

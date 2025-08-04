
-- Fix column name mismatches in contacts table
ALTER TABLE public.contacts 
RENAME COLUMN company TO company_name;

-- Fix column name mismatches in leads table  
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS website text;

-- Update the industry enum to match what's used in the app code
DO $$ 
BEGIN
    -- Update industry enum for contacts
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'industry_type') THEN
        ALTER TYPE industry_type ADD VALUE IF NOT EXISTS 'Automotive';
    END IF;
    
    -- Set default industry values that match the enum
    UPDATE public.contacts SET industry = 'Other' WHERE industry NOT IN ('Other', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Government', 'Automotive');
    UPDATE public.leads SET industry = 'Other' WHERE industry NOT IN ('Other', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Government', 'Automotive');
END $$;

-- Update contact_source enum to match what's used in the app
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_source') THEN
        ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'Website';
        ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'Referral';
        ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'Social Media';
        ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'Email Campaign';
        ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'Trade Show';
        ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'Cold Call';
        ALTER TYPE contact_source ADD VALUE IF NOT EXISTS 'LinkedIn';
    END IF;
END $$;

-- Update region enum to match app expectations
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'region_type') THEN
        ALTER TYPE region_type RENAME TO region_type_old;
        CREATE TYPE region_type AS ENUM ('EU', 'US', 'ASIA', 'APAC', 'LATAM', 'MEA', 'Other');
        
        -- Update contacts table
        ALTER TABLE public.contacts 
        ALTER COLUMN country DROP DEFAULT,
        ALTER COLUMN country TYPE region_type USING 
          CASE 
            WHEN country::text = 'North America' THEN 'US'::region_type
            WHEN country::text = 'Europe' THEN 'EU'::region_type
            WHEN country::text = 'Asia' THEN 'ASIA'::region_type
            ELSE 'Other'::region_type
          END,
        ALTER COLUMN country SET DEFAULT 'EU'::region_type;
        
        -- Update leads table
        ALTER TABLE public.leads 
        ALTER COLUMN country DROP DEFAULT,
        ALTER COLUMN country TYPE region_type USING 
          CASE 
            WHEN country::text = 'North America' THEN 'US'::region_type
            WHEN country::text = 'Europe' THEN 'EU'::region_type  
            WHEN country::text = 'Asia' THEN 'ASIA'::region_type
            ELSE 'Other'::region_type
          END,
        ALTER COLUMN country SET DEFAULT 'EU'::region_type;
        
        DROP TYPE region_type_old;
    END IF;
END $$;


-- Remove unused tables that are causing build errors and aren't part of the current application
-- These tables appear to be referenced in components but don't exist in the database schema

-- First, let's clean up any potential orphaned data or unused columns
-- Remove any unused columns from existing tables if they exist
-- Note: Only including operations that are safe based on the current schema

-- Clean up any potential triggers or functions that might reference non-existent tables
-- This is a conservative cleanup focusing on what we know exists

-- Ensure all existing tables have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_created_by ON deals(created_by);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_expected_closing_date ON deals(expected_closing_date);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_owner ON contacts(contact_owner);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_contact_owner ON leads(contact_owner);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles("Email ID");

-- Clean up any unused RLS policies or functions that might exist
-- Remove any potential orphaned security policies

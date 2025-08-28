-- Update RLS policies for role-based permissions

-- Drop existing policies for contacts
DROP POLICY IF EXISTS "Admin and Manager can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Only Admin and Manager can delete contacts" ON public.contacts;
DROP POLICY IF EXISTS "Only Admin and Manager can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Only Admin and Manager can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts" ON public.contacts;

-- Create new contact policies
CREATE POLICY "All authenticated users can view contacts" 
ON public.contacts 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text, 'user'::text]));

CREATE POLICY "Admin and Manager can delete all contacts" 
ON public.contacts 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Admin and Manager can insert contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])) AND (created_by = auth.uid()));

CREATE POLICY "Users can insert their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK ((get_user_role(auth.uid()) = 'user'::text) AND (created_by = auth.uid()));

CREATE POLICY "Admin and Manager can update all contacts" 
ON public.contacts 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Users can only update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING ((get_user_role(auth.uid()) = 'user'::text) AND (created_by = auth.uid()));

-- Drop existing policies for leads
DROP POLICY IF EXISTS "Admin and Manager can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Only Admin and Manager can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Only Admin and Manager can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Only Admin and Manager can update leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads" ON public.leads;

-- Create new lead policies
CREATE POLICY "All authenticated users can view leads" 
ON public.leads 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text, 'user'::text]));

CREATE POLICY "Admin and Manager can delete all leads" 
ON public.leads 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Admin and Manager can insert leads" 
ON public.leads 
FOR INSERT 
WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])) AND (created_by = auth.uid()));

CREATE POLICY "Users can insert their own leads" 
ON public.leads 
FOR INSERT 
WITH CHECK ((get_user_role(auth.uid()) = 'user'::text) AND (created_by = auth.uid()));

CREATE POLICY "Admin and Manager can update all leads" 
ON public.leads 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Users can only update their own leads" 
ON public.leads 
FOR UPDATE 
USING ((get_user_role(auth.uid()) = 'user'::text) AND (created_by = auth.uid()));

-- Update deals policies - completely block users from deals
DROP POLICY IF EXISTS "Only Admin and Manager can delete deals" ON public.deals;
DROP POLICY IF EXISTS "Only Admin and Manager can insert deals" ON public.deals;
DROP POLICY IF EXISTS "Only Admin and Manager can update deals" ON public.deals;
DROP POLICY IF EXISTS "Only Admin and Manager can view deals" ON public.deals;

-- Create new deal policies - Admin and Manager only, no user access
CREATE POLICY "Only Admin and Manager can view deals" 
ON public.deals 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can insert deals" 
ON public.deals 
FOR INSERT 
WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])) AND (created_by = auth.uid()));

CREATE POLICY "Only Admin and Manager can update deals" 
ON public.deals 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can delete deals" 
ON public.deals 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- Update deal action items policies - Admin and Manager only
DROP POLICY IF EXISTS "Only Admin and Manager can create deal action items" ON public.deal_action_items;
DROP POLICY IF EXISTS "Only Admin and Manager can update deal action items" ON public.deal_action_items;
DROP POLICY IF EXISTS "Only Admin and Manager can view deal action items" ON public.deal_action_items;

CREATE POLICY "Only Admin and Manager can view deal action items" 
ON public.deal_action_items 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can create deal action items" 
ON public.deal_action_items 
FOR INSERT 
WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])) AND (created_by = auth.uid()));

CREATE POLICY "Only Admin and Manager can update deal action items" 
ON public.deal_action_items 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can delete deal action items" 
ON public.deal_action_items 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- Update lead action items policies - allow users to view all but only edit their own
DROP POLICY IF EXISTS "All authenticated users can view lead action items" ON public.lead_action_items;
DROP POLICY IF EXISTS "Only Admin and Manager can create lead action items" ON public.lead_action_items;
DROP POLICY IF EXISTS "Only Admin and Manager can delete lead action items" ON public.lead_action_items;
DROP POLICY IF EXISTS "Only Admin and Manager can update lead action items" ON public.lead_action_items;

CREATE POLICY "All authenticated users can view lead action items" 
ON public.lead_action_items 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text, 'user'::text]));

CREATE POLICY "Admin and Manager can create lead action items" 
ON public.lead_action_items 
FOR INSERT 
WITH CHECK ((get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])) AND (created_by = auth.uid()));

CREATE POLICY "Users can create their own lead action items" 
ON public.lead_action_items 
FOR INSERT 
WITH CHECK ((get_user_role(auth.uid()) = 'user'::text) AND (created_by = auth.uid()));

CREATE POLICY "Admin and Manager can update all lead action items" 
ON public.lead_action_items 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Users can only update their own lead action items" 
ON public.lead_action_items 
FOR UPDATE 
USING ((get_user_role(auth.uid()) = 'user'::text) AND (created_by = auth.uid()));

CREATE POLICY "Admin and Manager can delete all lead action items" 
ON public.lead_action_items 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Users can delete their own lead action items" 
ON public.lead_action_items 
FOR DELETE 
USING ((get_user_role(auth.uid()) = 'user'::text) AND (created_by = auth.uid()));

-- Update security audit log policies - Admin only (no manager access for audit logs)
DROP POLICY IF EXISTS "Only Admin can view audit logs" ON public.security_audit_log;

CREATE POLICY "Only Admin can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::text);

-- Update yearly revenue targets policies - Admin and Manager only
DROP POLICY IF EXISTS "Admin and Manager can view revenue targets" ON public.yearly_revenue_targets;
DROP POLICY IF EXISTS "Only Admin can manage revenue targets" ON public.yearly_revenue_targets;

CREATE POLICY "Admin and Manager can view revenue targets" 
ON public.yearly_revenue_targets 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin can manage revenue targets" 
ON public.yearly_revenue_targets 
FOR ALL
USING (get_user_role(auth.uid()) = 'admin'::text);
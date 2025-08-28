-- Update RLS policies for role-based access control

-- Drop existing conflicting policies for contacts
DROP POLICY IF EXISTS "Authenticated users can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts, admins can update all" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts, admins can delete all" ON public.contacts;

-- Drop existing conflicting policies for leads  
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads, admins can update all" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads, admins can delete all" ON public.leads;

-- Drop existing conflicting policies for deals (Users should have NO access)
DROP POLICY IF EXISTS "Only admin/manager can view deals" ON public.deals;
DROP POLICY IF EXISTS "Only admin/manager can insert deals" ON public.deals;
DROP POLICY IF EXISTS "Only admin/manager can update deals" ON public.deals;
DROP POLICY IF EXISTS "Only admin/manager can delete deals" ON public.deals;

-- Drop existing conflicting policies for deal_action_items (Users should have NO access)
DROP POLICY IF EXISTS "Only admin/manager can view deal action items" ON public.deal_action_items;
DROP POLICY IF EXISTS "Only admin/manager can create deal action items" ON public.deal_action_items;
DROP POLICY IF EXISTS "Only admin/manager can update deal action items" ON public.deal_action_items;
DROP POLICY IF EXISTS "Only admin/manager can delete deal action items" ON public.deal_action_items;

-- CONTACTS: Admin and Manager can do everything, Users read-only
CREATE POLICY "Admin and Manager can view all contacts" 
ON public.contacts 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text, 'user'::text]));

CREATE POLICY "Only Admin and Manager can insert contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]) 
  AND created_by = auth.uid()
);

CREATE POLICY "Only Admin and Manager can update contacts" 
ON public.contacts 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can delete contacts" 
ON public.contacts 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- LEADS: Admin and Manager can do everything, Users read-only
CREATE POLICY "Admin and Manager can view all leads" 
ON public.leads 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text, 'user'::text]));

CREATE POLICY "Only Admin and Manager can insert leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]) 
  AND created_by = auth.uid()
);

CREATE POLICY "Only Admin and Manager can update leads" 
ON public.leads 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can delete leads" 
ON public.leads 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- DEALS: Only Admin and Manager have access, Users blocked completely
CREATE POLICY "Only Admin and Manager can view deals" 
ON public.deals 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can insert deals" 
ON public.deals 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]) 
  AND created_by = auth.uid()
);

CREATE POLICY "Only Admin and Manager can update deals" 
ON public.deals 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can delete deals" 
ON public.deals 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- DEAL ACTION ITEMS: Only Admin and Manager have access, Users blocked completely
CREATE POLICY "Only Admin and Manager can view deal action items" 
ON public.deal_action_items 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can create deal action items" 
ON public.deal_action_items 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]) 
  AND created_by = auth.uid()
);

CREATE POLICY "Only Admin and Manager can update deal action items" 
ON public.deal_action_items 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- LEAD ACTION ITEMS: Update existing policies for new role structure
DROP POLICY IF EXISTS "Users can create action items for leads" ON public.lead_action_items;
DROP POLICY IF EXISTS "Users can update their own action items, admins can update all" ON public.lead_action_items;
DROP POLICY IF EXISTS "Users can delete their own action items, admins can delete all" ON public.lead_action_items;
DROP POLICY IF EXISTS "Users can view action items for accessible leads" ON public.lead_action_items;

CREATE POLICY "All authenticated users can view lead action items" 
ON public.lead_action_items 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text, 'user'::text]));

CREATE POLICY "Only Admin and Manager can create lead action items" 
ON public.lead_action_items 
FOR INSERT 
WITH CHECK (
  get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]) 
  AND created_by = auth.uid()
);

CREATE POLICY "Only Admin and Manager can update lead action items" 
ON public.lead_action_items 
FOR UPDATE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

CREATE POLICY "Only Admin and Manager can delete lead action items" 
ON public.lead_action_items 
FOR DELETE 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));

-- PROFILES: Update existing policies for new role structure
DROP POLICY IF EXISTS "Users can update their own profile or admins can update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile or admins can view all" ON public.profiles;

CREATE POLICY "Users can view their own profile, Admin and Manager can view all" 
ON public.profiles 
FOR SELECT 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])) 
  OR (id = auth.uid())
);

CREATE POLICY "Users can update their own profile, Admin and Manager can update all" 
ON public.profiles 
FOR UPDATE 
USING (
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text])) 
  OR (id = auth.uid())
);

-- SECURITY AUDIT LOG: Update existing policies for Manager role restrictions
DROP POLICY IF EXISTS "Only admin/manager can view audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.security_audit_log;

CREATE POLICY "Only Admin can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

-- YEARLY REVENUE TARGETS: Update existing policies for Manager role restrictions  
DROP POLICY IF EXISTS "Only admin/manager can view revenue targets" ON public.yearly_revenue_targets;
DROP POLICY IF EXISTS "Admins can manage revenue targets" ON public.yearly_revenue_targets;

CREATE POLICY "Only Admin can manage revenue targets" 
ON public.yearly_revenue_targets 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin and Manager can view revenue targets" 
ON public.yearly_revenue_targets 
FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text]));
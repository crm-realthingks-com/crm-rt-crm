
-- 1) Elevate "manager" to admin-level for content RLS by updating is_user_admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT public.get_user_role(user_id) IN ('admin', 'manager');
$function$;

-- 2) Tighten user_roles RLS so only Admins can manage roles and everyone can only read their own role

-- Drop existing overly-permissive or duplicate policies (if present)
DROP POLICY IF EXISTS "Users can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Re-create minimal, correct policies:
-- Admins (by metadata only) can fully manage roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_current_user_admin_by_metadata())
  WITH CHECK (public.is_current_user_admin_by_metadata());

-- Users can read ONLY their own role (for non-admins)
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

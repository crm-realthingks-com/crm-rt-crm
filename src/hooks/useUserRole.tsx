
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole('user');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching role for user:', user.email);
        
        // Check user metadata directly for role
        const role = user.user_metadata?.role || 'user';
        console.log('User role from metadata:', role);
        setUserRole(role);
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setUserRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin || isManager;
  const canManageUsers = isAdmin; // Only admins can manage users
  const canAccessSettings = true; // All users can access settings
  const canAccessDeals = isAdmin || isManager; // Users blocked from deals
  const canViewAuditLogs = isAdmin; // Only admin can view audit logs
  const canEditContacts = isAdmin || isManager; // Users read-only for contacts
  const canEditLeads = isAdmin || isManager; // Users read-only for leads

  return {
    userRole,
    isAdmin,
    isManager,
    canEdit,
    canDelete,
    canManageUsers,
    canAccessSettings,
    canAccessDeals,
    canViewAuditLogs,
    canEditContacts,
    canEditLeads,
    loading
  };
};

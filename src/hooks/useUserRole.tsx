
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
  const isUser = userRole === 'user';
  
  // Core permissions
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin || isManager;
  
  // Module access permissions
  const canAccessDeals = isAdmin || isManager; // Users blocked from deals completely
  const canAccessSettings = true; // All users can access settings
  
  // Management permissions
  const canManageUsers = isAdmin; // Only admins can manage users
  const canViewAuditLogs = isAdmin; // Only admin can view audit logs (managers blocked)
  
  // Data editing permissions
  const canEditAllContacts = isAdmin || isManager; // Admin/Manager can edit all contacts
  const canEditOwnContacts = true; // All users can edit their own contacts
  const canEditAllLeads = isAdmin || isManager; // Admin/Manager can edit all leads  
  const canEditOwnLeads = true; // All users can edit their own leads
  
  // Deletion permissions
  const canDeleteContacts = isAdmin || isManager; // Only Admin/Manager can delete contacts
  const canDeleteLeads = isAdmin || isManager; // Only Admin/Manager can delete leads

  return {
    userRole,
    isAdmin,
    isManager,
    isUser,
    canEdit,
    canDelete,
    canAccessDeals,
    canAccessSettings,
    canManageUsers,
    canViewAuditLogs,
    canEditAllContacts,
    canEditOwnContacts,
    canEditAllLeads,
    canEditOwnLeads,
    canDeleteContacts,
    canDeleteLeads,
    loading
  };
};

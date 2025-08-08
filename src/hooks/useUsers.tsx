
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email?: string;
  display_name?: string;
  full_name?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users');
      
      if (error) {
        throw error;
      }
      
      const formattedUsers = data.users?.map((user: any) => ({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        full_name: user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split('@')[0]
      })) || [];
      
      setUsers(formattedUsers);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
};

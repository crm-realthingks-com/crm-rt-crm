
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecureDataAccess } from '@/hooks/useSecureDataAccess';
import { useToast } from '@/hooks/use-toast';
import { useCRUDAudit } from '@/hooks/useCRUDAudit';

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  created_by?: string;
  contact_owner?: string;
  created_time?: string;
  modified_time?: string;
}

interface CreateContactData {
  contact_name: string; // Make this required for creation
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  region?: string; // Changed from country to region
  description?: string;
  contact_owner?: string;
}

export const useSecureContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { secureQuery, secureExport } = useSecureDataAccess();
  const { logDelete } = useCRUDAudit();
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      const result = await secureQuery('contacts', query, 'SELECT');
      setContacts(result.data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Access Denied",
        description: "You don't have permission to view these contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContact = async (contactData: CreateContactData) => {
    try {
      const query = supabase
        .from('contacts')
        .insert([{
          ...contactData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      const result = await secureQuery('contacts', query, 'INSERT');
      
      if (result.data) {
        setContacts(prev => [result.data, ...prev]);
        toast({
          title: "Success",
          description: "Contact created successfully",
        });
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast({
        title: "Error",
        description: "Failed to create contact",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const query = supabase
        .from('contacts')
        .update({
          ...updates,
          modified_time: new Date().toISOString(),
          modified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id)
        .select()
        .single();

      const result = await secureQuery('contacts', query, 'UPDATE');
      
      if (result.data) {
        setContacts(prev => prev.map(contact => 
          contact.id === id ? result.data : contact
        ));
      }
      
      return result.data;
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      // First get the contact to check ownership and get data for logging
      const contactToDelete = contacts.find(c => c.id === id);
      if (!contactToDelete) {
        throw new Error('Contact not found');
      }

      console.log('Attempting to delete contact:', { id, contactToDelete });

      // Count contacts before deletion to verify if deletion actually happened
      const { count: beforeCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      console.log('Contacts count before deletion:', beforeCount);

      // Try to delete the contact
      const { data, error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)
        .select()
        .single();

      console.log('Delete operation result:', { data, error });

      // Check if there's an error OR if no data was returned (both indicate failure)
      if (error || !data) {
        console.log('Delete operation failed - checking for permission error');
        
        // Count contacts after deletion attempt to verify if record was actually deleted
        const { count: afterCount } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('id', id);

        console.log('Contacts count after deletion attempt:', afterCount);

        // If count is the same, the deletion was blocked (permission issue)
        if (beforeCount === afterCount && afterCount === 1) {
          console.log('Deletion was blocked - logging as unauthorized attempt');
          
          // Log unauthorized attempt
          await logDelete('contacts', id, contactToDelete, undefined, 'Blocked');
          
          toast({
            title: "Permission Denied",
            description: "You don't have permission to delete this record.",
            variant: "destructive",
          });
          
          return; // Exit early, don't throw error or show success
        }

        // For other database errors, throw the error
        if (error) {
          throw error;
        }
      }

      // If we get here and have data, the deletion was successful
      if (data) {
        console.log('Delete operation successful, updating UI');
        setContacts(prev => prev.filter(contact => contact.id !== id));
        
        // Log successful deletion
        await logDelete('contacts', id, contactToDelete, undefined, 'Success');
        
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        });
      }

    } catch (error: any) {
      console.error('Error in deleteContact:', error);
      
      // Show generic error for unexpected issues
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const exportContacts = async (contactsToExport: Contact[]) => {
    try {
      return await secureExport('contacts', contactsToExport, 'CSV');
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    loading,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    exportContacts
  };
};

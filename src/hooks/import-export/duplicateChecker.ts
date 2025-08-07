
import { supabase } from '@/integrations/supabase/client';

export const createDuplicateChecker = (tableName: string) => {
  return async (record: any): Promise<boolean> => {
    try {
      if (tableName === 'deals') {
        // Check for duplicates based on deal_name or project_name
        const recordName = record.deal_name || record.project_name;
        if (!recordName) return false;

        const { data, error } = await supabase
          .from('deals')
          .select('id, deal_name')
          .eq('deal_name', recordName.trim())
          .limit(1);

        if (error) {
          console.error('Error checking for duplicates:', error);
          return false;
        }

        return data && data.length > 0;
      }

      if (tableName === 'contacts' || tableName === 'contacts_module') {
        // Check for duplicates based on contact_name and company_name combination
        if (!record.contact_name) return false;

        let query = supabase
          .from('contacts')
          .select('id, contact_name, company_name')
          .eq('contact_name', record.contact_name.trim());

        if (record.company_name) {
          query = query.eq('company_name', record.company_name.trim());
        } else {
          query = query.is('company_name', null);
        }

        const { data, error } = await query.limit(1);

        if (error) {
          console.error('Error checking for duplicates:', error);
          return false;
        }

        return data && data.length > 0;
      }

      if (tableName === 'leads') {
        // Check for duplicates based on lead_name and company_name combination
        if (!record.lead_name) return false;

        let query = supabase
          .from('leads')
          .select('id, lead_name, company_name')
          .eq('lead_name', record.lead_name.trim());

        if (record.company_name) {
          query = query.eq('company_name', record.company_name.trim());
        } else {
          query = query.is('company_name', null);
        }

        const { data, error } = await query.limit(1);

        if (error) {
          console.error('Error checking for duplicates:', error);
          return false;
        }

        return data && data.length > 0;
      }

      // Default: no duplicate detection for unknown tables
      return false;
    } catch (error) {
      console.error('Error in duplicate checker:', error);
      return false;
    }
  };
};

export const getUniqueIdentifier = (record: any, tableName: string): string => {
  if (tableName === 'deals') {
    return record.deal_name || record.project_name || 'unknown';
  }
  
  if (tableName === 'contacts') {
    return `${record.contact_name || 'unknown'}-${record.company_name || 'no-company'}`;
  }
  
  if (tableName === 'leads') {
    return `${record.lead_name || 'unknown'}-${record.company_name || 'no-company'}`;
  }
  
  return record.id || 'unknown';
};

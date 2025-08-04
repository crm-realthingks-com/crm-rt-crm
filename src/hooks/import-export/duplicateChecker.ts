
import { supabase } from "@/integrations/supabase/client";

export const checkDuplicateDeals = async (deals: any[]) => {
  const duplicates: any[] = [];
  
  for (const deal of deals) {
    if (deal.project_name) {
      const { data, error } = await supabase
        .from('deals')
        .select('id, deal_name')
        .eq('deal_name', deal.project_name)
        .maybeSingle();
      
      if (data) {
        duplicates.push({
          importRecord: deal,
          existingRecord: data,
          matchField: 'deal_name'
        });
      }
    }
  }
  
  return duplicates;
};

export const checkDuplicateContacts = async (contacts: any[]) => {
  const duplicates: any[] = [];
  
  for (const contact of contacts) {
    if (contact.email) {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, contact_name, email')
        .eq('email', contact.email)
        .maybeSingle();
      
      if (data) {
        duplicates.push({
          importRecord: contact,
          existingRecord: data,
          matchField: 'email'
        });
      }
    }
  }
  
  return duplicates;
};

export const createDuplicateChecker = (entityType: 'deals' | 'contacts') => {
  return entityType === 'deals' ? checkDuplicateDeals : checkDuplicateContacts;
};

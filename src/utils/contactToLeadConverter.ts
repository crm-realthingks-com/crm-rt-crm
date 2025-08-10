
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  region?: string;
  description?: string;
  contact_owner?: string;
  created_by?: string;
  modified_by?: string;
}

export interface ConvertToLeadResult {
  success: boolean;
  leadId?: string;
  error?: string;
}

export const convertContactToLead = async (contact: Contact, currentUserId: string): Promise<ConvertToLeadResult> => {
  try {
    console.log('Converting contact to lead:', contact.id, contact.contact_name);

    // Map contact fields to lead fields
    const leadData = {
      lead_name: contact.contact_name,
      company_name: contact.company_name || '',
      position: contact.position || null,
      email: contact.email || null,
      phone_no: contact.phone_no || null,
      linkedin: contact.linkedin || null,
      website: contact.website || null,
      lead_source: contact.contact_source || null,
      industry: contact.industry || null,
      region: contact.region || 'EU',
      description: contact.description || null,
      status: 'New', // Default status for new leads
      contact_owner: contact.contact_owner || currentUserId,
      created_by: currentUserId,
      modified_by: currentUserId,
      created_time: new Date().toISOString(),
      modified_time: new Date().toISOString()
    };

    console.log('Lead data to insert:', leadData);

    // Insert the new lead
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select('id')
      .single();

    if (error) {
      console.error('Error converting contact to lead:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully converted contact to lead:', data?.id);
    return { success: true, leadId: data?.id };

  } catch (error: any) {
    console.error('Exception during contact to lead conversion:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

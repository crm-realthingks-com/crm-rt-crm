
import { supabase } from '@/integrations/supabase/client';

export interface ContactToLeadData {
  contact_name: string;
  company_name: string;
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
}

export interface LeadData {
  lead_name: string;
  company_name: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  lead_source?: string;
  industry?: string;
  region?: string;
  status: string;
  description?: string;
  contact_owner?: string;
  created_by: string;
  modified_by: string;
  created_time: string;
  modified_time: string;
}

export const convertContactToLead = async (
  contactData: ContactToLeadData,
  userId: string
): Promise<{ success: boolean; leadId?: string; error?: string }> => {
  try {
    console.log('Converting contact to lead:', contactData);
    
    // Check if lead already exists
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .eq('lead_name', contactData.contact_name)
      .eq('company_name', contactData.company_name || '')
      .limit(1);

    if (checkError) {
      console.error('Error checking for existing lead:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingLead && existingLead.length > 0) {
      return { 
        success: false, 
        error: 'A lead with this name and company already exists' 
      };
    }

    // Convert contact data to lead data
    const leadData: LeadData = {
      lead_name: contactData.contact_name,
      company_name: contactData.company_name || '',
      position: contactData.position || null,
      email: contactData.email || null,
      phone_no: contactData.phone_no || null,
      linkedin: contactData.linkedin || null,
      website: contactData.website || null,
      lead_source: contactData.contact_source || null,
      industry: contactData.industry || null,
      region: contactData.region || 'EU',
      status: 'New',
      description: contactData.description || null,
      contact_owner: contactData.contact_owner || userId,
      created_by: userId,
      modified_by: userId,
      created_time: new Date().toISOString(),
      modified_time: new Date().toISOString()
    };

    console.log('Lead data to insert:', leadData);

    // Insert the new lead
    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert([leadData])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('Lead created successfully:', insertedLead);
    return { success: true, leadId: insertedLead.id };

  } catch (error: any) {
    console.error('Error in convertContactToLead:', error);
    return { success: false, error: error.message };
  }
};

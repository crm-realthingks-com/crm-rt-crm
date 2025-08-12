
import { supabase } from '@/integrations/supabase/client';

export interface LeadToDealData {
  id: string;
  lead_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  lead_source?: string;
  industry?: string;
  region?: string;
  description?: string;
  contact_owner?: string;
}

export interface DealData {
  deal_name: string;
  lead_name?: string;
  customer_name?: string;
  company_name?: string;
  region?: string;
  lead_owner?: string;
  stage: string;
  related_lead_id?: string;
  created_by: string;
  modified_by: string;
  created_at: string;
  modified_at: string;
}

export const convertLeadToDeal = async (
  leadData: LeadToDealData,
  userId: string
): Promise<{ success: boolean; dealId?: string; error?: string }> => {
  try {
    console.log('Converting lead to deal:', leadData);
    
    // First, update the lead status to "Qualified"
    const { error: updateError } = await supabase
      .from('leads')
      .update({ 
        status: 'Qualified',
        modified_by: userId,
        modified_time: new Date().toISOString()
      })
      .eq('id', leadData.id);

    if (updateError) {
      console.error('Error updating lead status:', updateError);
      return { success: false, error: updateError.message };
    }

    // Create deal data from lead data
    const dealData: DealData = {
      deal_name: `${leadData.company_name || 'Unknown Company'} - ${leadData.lead_name}`,
      lead_name: leadData.lead_name,
      customer_name: leadData.lead_name,
      company_name: leadData.company_name || null,
      region: leadData.region || 'EU',
      lead_owner: leadData.contact_owner || userId,
      stage: 'Lead',
      related_lead_id: leadData.id,
      created_by: userId,
      modified_by: userId,
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString()
    };

    console.log('Deal data to insert:', dealData);

    // Insert the new deal
    const { data: insertedDeal, error: insertError } = await supabase
      .from('deals')
      .insert([dealData])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting deal:', insertError);
      // If deal creation fails, revert the lead status
      await supabase
        .from('leads')
        .update({ 
          status: 'New',
          modified_by: userId,
          modified_time: new Date().toISOString()
        })
        .eq('id', leadData.id);
      
      return { success: false, error: insertError.message };
    }

    console.log('Deal created successfully, lead status updated to Qualified:', insertedDeal);
    return { success: true, dealId: insertedDeal.id };

  } catch (error: any) {
    console.error('Error in convertLeadToDeal:', error);
    return { success: false, error: error.message };
  }
};

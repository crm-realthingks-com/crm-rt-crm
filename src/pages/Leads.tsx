
import { useState } from 'react';
import { LeadsTable } from '@/components/LeadsTable';
import { LeadConversionHandler } from '@/components/LeadConversionHandler';
import { Deal } from '@/types/deal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { convertLeadToDeal } from '@/utils/leadToDealConverter';

const Leads = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleLeadEdit = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadModalOpen(true);
  };

  const handleLeadModalClose = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
  };

  const handleLeadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDealSave = async (dealData: Partial<Deal>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Creating deal with data:', dealData);
      
      // Ensure deal_name is always provided
      const dealToInsert = {
        ...dealData,
        deal_name: dealData.deal_name || dealData.project_name || 'Untitled Deal',
        created_by: user.id,
        modified_by: user.id,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('deals')
        .insert(dealToInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating deal:', error);
        throw error;
      }

      console.log('Deal created successfully:', data);

      // Update the related lead status to "Qualified" if there's a related_lead_id
      if (dealData.related_lead_id) {
        console.log('Updating lead status to Qualified for lead:', dealData.related_lead_id);
        
        const { error: updateError } = await supabase
          .from('leads')
          .update({ 
            status: 'Qualified',
            modified_by: user.id,
            modified_time: new Date().toISOString()
          })
          .eq('id', dealData.related_lead_id);

        if (updateError) {
          console.error('Error updating lead status:', updateError);
          // Still show success for deal creation, but warn about lead update
          toast({
            title: "Deal Created",
            description: "Deal created successfully, but failed to update lead status",
            variant: "destructive",
          });
        } else {
          console.log('Lead status updated to Qualified successfully');
          toast({
            title: "Success",
            description: "Deal created successfully and lead status updated to Qualified",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Deal created successfully",
        });
      }

      // Trigger refresh of the leads table
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error in handleDealSave:', error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <LeadsTable 
        key={refreshTrigger}
        onLeadEdit={handleLeadEdit}
      />
      
      <LeadConversionHandler
        lead={selectedLead}
        isLeadModalOpen={isLeadModalOpen}
        onLeadModalClose={handleLeadModalClose}
        onLeadSuccess={handleLeadSuccess}
        onDealSave={handleDealSave}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default Leads;

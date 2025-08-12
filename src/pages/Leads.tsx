
import { useState } from 'react';
import { LeadsTable } from '@/components/LeadsTable';
import { LeadConversionHandler } from '@/components/LeadConversionHandler';
import { Deal } from '@/types/deal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

  const handleDealSave = async (dealData: Partial<Deal>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Creating deal with data:', dealData);
      
      const dealToInsert = {
        ...dealData,
        created_by: user.id,
        modified_by: user.id,
        created_at: new Date().toISOString(),
        modified_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('deals')
        .insert([dealToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error creating deal:', error);
        throw error;
      }

      console.log('Deal created successfully:', data);

      toast({
        title: "Success",
        description: "Deal created successfully from lead conversion",
      });

      // Trigger refresh of the leads table
      setRefreshTrigger(prev => prev + 1);
      
      return data;
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


import { useState } from 'react';
import { LeadModal } from './LeadModal';
import { DealForm } from './DealForm';
import { Deal } from '@/types/deal';

interface LeadConversionHandlerProps {
  lead?: any;
  isLeadModalOpen: boolean;
  onLeadModalClose: () => void;
  onLeadSuccess?: () => void;
  onDealSave: (dealData: Partial<Deal>) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

export const LeadConversionHandler = ({
  lead,
  isLeadModalOpen,
  onLeadModalClose,
  onLeadSuccess,
  onDealSave,
  onRefresh
}: LeadConversionHandlerProps) => {
  const [isDealFormOpen, setIsDealFormOpen] = useState(false);
  const [leadDataForConversion, setLeadDataForConversion] = useState<any>(null);

  const handleConvertToDeal = (leadData: any) => {
    console.log("Starting lead conversion process with data:", leadData);
    setLeadDataForConversion(leadData);
    setIsDealFormOpen(true);
  };

  const handleDealFormClose = () => {
    setIsDealFormOpen(false);
    setLeadDataForConversion(null);
  };

  const handleDealSave = async (dealData: Partial<Deal>) => {
    await onDealSave(dealData);
    setIsDealFormOpen(false);
    setLeadDataForConversion(null);
  };

  return (
    <>
      <LeadModal
        open={isLeadModalOpen}
        onOpenChange={onLeadModalClose}
        lead={lead}
        onSuccess={onLeadSuccess}
        onConvertToDeal={handleConvertToDeal}
      />
      
      <DealForm
        deal={null}
        isOpen={isDealFormOpen}
        onClose={handleDealFormClose}
        onSave={handleDealSave}
        isCreating={true}
        initialStage="Lead"
        leadData={leadDataForConversion}
        onRefresh={onRefresh}
      />
    </>
  );
};

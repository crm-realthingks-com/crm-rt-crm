import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Deal, DealStage, getNextStage, getFinalStageOptions, getStageIndex } from "@/types/deal";
import { useToast } from "@/hooks/use-toast";
import { validateRequiredFields, getFieldErrors, validateDateLogic, validateRevenueSum } from "./deal-form/validation";
import { DealStageForm } from "./deal-form/DealStageForm";
import { supabase } from "@/integrations/supabase/client";

interface DealFormProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (dealData: Partial<Deal>) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isCreating?: boolean;
  initialStage?: DealStage;
  leadData?: any; // Add leadData prop for conversion
}

export const DealForm = ({ 
  deal, 
  isOpen, 
  onClose, 
  onSave, 
  isCreating = false, 
  initialStage, 
  onRefresh,
  leadData 
}: DealFormProps) => {
  const [formData, setFormData] = useState<Partial<Deal>>({});
  const [loading, setLoading] = useState(false);
  const [showPreviousStages, setShowPreviousStages] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log("=== DEAL FORM USEEFFECT DEBUG ===");
    console.log("Deal:", deal);
    console.log("isCreating:", isCreating);
    console.log("initialStage:", initialStage);
    console.log("isOpen:", isOpen);
    console.log("leadData:", leadData);
    
    if (deal) {
      console.log("Setting form data from deal:", deal);
      // Initialize revenue fields with 0 if they are null
      const initializedDeal = {
        ...deal,
        quarterly_revenue_q1: deal.quarterly_revenue_q1 ?? 0,
        quarterly_revenue_q2: deal.quarterly_revenue_q2 ?? 0,
        quarterly_revenue_q3: deal.quarterly_revenue_q3 ?? 0,
        quarterly_revenue_q4: deal.quarterly_revenue_q4 ?? 0,
      };
      setFormData(initializedDeal);
      // Hide validation errors for existing deals initially - only show after Save is clicked
      setShowValidationErrors(false);
    } else if (isCreating && initialStage) {
      // Set default values for new deals
      const defaultData: Partial<Deal> = {
        stage: initialStage,
        currency_type: 'EUR', // Default to EUR
        quarterly_revenue_q1: 0,
        quarterly_revenue_q2: 0,
        quarterly_revenue_q3: 0,
        quarterly_revenue_q4: 0,
      };

      // If leadData is provided, pre-fill the form with lead information
      // but leave project_name and priority empty for manual input
      if (leadData) {
        console.log("Pre-filling form with lead data:", leadData);
        defaultData.lead_name = leadData.lead_name;
        defaultData.customer_name = leadData.company_name || leadData.lead_name;
        defaultData.region = leadData.region || 'EU';
        defaultData.lead_owner = leadData.contact_owner;
        defaultData.related_lead_id = leadData.id;
        // Don't pre-fill project_name and priority - user must fill these manually
      }

      console.log("Setting default form data for new deal:", defaultData);
      setFormData(defaultData);
      // Hide validation errors for new deals initially
      setShowValidationErrors(false);
    }
    setShowPreviousStages(false);
    
    // Reset selected lead ID when dialog closes or opens
    if (!isOpen) {
      console.log("Dialog closed - Reset selected lead ID to null");
      setSelectedLeadId(null);
    }
  }, [deal, isCreating, initialStage, isOpen, leadData]);

  const currentStage = formData.stage || 'Lead';

  // Update field errors when form data changes, but only show them if validation should be displayed
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const errors = getFieldErrors(formData, currentStage);
      setFieldErrors(showValidationErrors ? errors : {});
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [formData, currentStage, showValidationErrors]);

  const handleFieldChange = (field: string, value: any) => {
    console.log(`=== FIELD UPDATE DEBUG ===`);
    console.log(`Updating field: ${field}`);
    console.log(`New value:`, value, `(type: ${typeof value})`);
    console.log(`Current formData before update:`, formData);
    
    setFormData(prev => {
      const updated = { ...prev };
      // Use type assertion to bypass strict type checking for dynamic assignment
      (updated as any)[field] = value;
      console.log(`Updated formData:`, updated);
      return updated;
    });
    
    // Clear field error when user updates the field (only if validation is showing)
    if (showValidationErrors && fieldErrors[field]) {
      setFieldErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleLeadSelect = (lead: any) => {
    console.log("=== LEAD SELECT DEBUG ===");
    console.log("DealForm - Lead selected for conversion:", lead);
    console.log("Lead ID:", lead.id);
    console.log("Lead data:", lead);
    
    if (lead && lead.id) {
      console.log("Setting selected lead ID to:", lead.id);
      setSelectedLeadId(lead.id);
      
      // Auto-populate form fields from the selected lead
      console.log("Auto-populating form fields from lead data");
      setFormData(prev => {
        const updated = {
          ...prev,
          lead_name: lead.lead_name || '',
          customer_name: lead.company_name || '',
          region: lead.region || 'EU',
          lead_owner: lead.contact_owner || '',
          related_lead_id: lead.id
        };
        console.log("Form data after lead selection:", updated);
        return updated;
      });
    } else {
      console.error("Invalid lead data provided:", lead);
    }
  };

  const updateLeadStatus = async (leadId: string): Promise<boolean> => {
    try {
      console.log("Updating lead status to Qualified for lead ID:", leadId);
      
      const { error } = await supabase
        .from('leads')
        .update({ 
          status: 'Qualified',
          modified_time: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) {
        console.error('Error updating lead status:', error);
        return false;
      }

      console.log('Lead status updated to Qualified successfully');
      return true;
    } catch (error: any) {
      console.error('Unexpected error updating lead status:', error);
      return false;
    }
  };

  const validateLeadConversionRequiredFields = (data: Partial<Deal>): boolean => {
    // For lead conversion, ensure project_name and priority are filled
    if (leadData && isCreating) {
      return !!(data.project_name && data.priority);
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("=== DEAL FORM SUBMIT DEBUG ===");
      console.log("Current stage:", currentStage);
      console.log("Form data before save:", formData);
      console.log("Selected lead ID for status update:", selectedLeadId);
      console.log("Lead data:", leadData);
      console.log("Is creating:", isCreating);
      
      // For lead conversion, validate that project_name and priority are filled
      if (leadData && isCreating && !validateLeadConversionRequiredFields(formData)) {
        console.error("Lead conversion validation failed: Missing project_name or priority");
        toast({
          title: "Validation Error",
          description: "Project Name and Priority are required when converting a lead to deal.",
          variant: "destructive",
        });
        return;
      }
      
      // Only validate date logic for saving - no required field validation for saving
      const dateValidation = validateDateLogic(formData);
      if (!dateValidation.isValid) {
        console.error("Date validation failed:", dateValidation.error);
        toast({
          title: "Validation Error",
          description: dateValidation.error,
          variant: "destructive",
        });
        return;
      }
      
      // Only validate revenue sum for Won stage when saving
      if (currentStage === 'Won') {
        const revenueValidation = validateRevenueSum(formData);
        if (!revenueValidation.isValid) {
          console.error("Revenue validation failed:", revenueValidation.error);
          toast({
            title: "Validation Error",
            description: revenueValidation.error,
            variant: "destructive",
          });
          return;
        }
      }
      
      // NO REQUIRED FIELD VALIDATION FOR SAVING - only for stage progression
      console.log("Skipping required field validation for save operation");
      
      const saveData = {
        ...formData,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      console.log("Save data:", saveData);
      
      await onSave(saveData);
      
      console.log("Deal save successful");
      
      // If this is a new deal created from a lead, update the original lead's status
      if (isCreating && leadData?.id) {
        console.log("=== LEAD CONVERSION STATUS UPDATE START ===");
        console.log("Deal created successfully, now updating lead status to Qualified for lead ID:", leadData.id);
        
        try {
          const statusUpdateSuccess = await updateLeadStatus(leadData.id);
          
          if (statusUpdateSuccess) {
            console.log("Lead status update successful");
            toast({
              title: "Success",
              description: "Deal created and lead status updated to Qualified",
            });
          } else {
            console.log("Lead status update failed, but deal was created");
            toast({
              title: "Warning",
              description: "Deal was created but lead status could not be updated",
              variant: "destructive",
            });
          }
        } catch (statusUpdateError) {
          console.error("Error during lead status update:", statusUpdateError);
          toast({
            title: "Warning",
            description: "Deal was created but there was an error updating the lead status",
            variant: "destructive",
          });
        }
        
        // Force refresh of both modules
        if (onRefresh) {
          console.log("Triggering refresh after lead conversion");
          setTimeout(() => {
            console.log("Executing refresh callback");
            onRefresh();
          }, 1000);
        }
        
        console.log("=== LEAD CONVERSION STATUS UPDATE END ===");
      } else {
        // Show success message for regular saves (not conversions from lead)
        toast({
          title: "Success",
          description: isCreating ? "Deal created successfully" : "Deal updated successfully",
        });
      }
      
      onClose();
      
      if (onRefresh && !leadData?.id) {
        setTimeout(onRefresh, 100);
      }
    } catch (error: any) {
      console.error("=== DEAL FORM SAVE ERROR ===");
      console.error("Error details:", error);
      
      toast({
        title: "Error",
        description: `Failed to save deal: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToNextStage = async () => {
    if (!canMoveToNextStage) return;
    
    setLoading(true);
    
    try {
      const nextStage = getNextStage(currentStage);
      if (nextStage) {
        console.log(`Moving deal from ${currentStage} to ${nextStage}`);
        
        const updatedData = {
          ...formData,
          stage: nextStage,
          deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
          modified_at: new Date().toISOString(),
          modified_by: deal?.created_by || formData.created_by
        };
        
        await onSave(updatedData);
        
        toast({
          title: "Success",
          description: `Deal moved to ${nextStage} stage`,
        });
        
        onClose();
        if (onRefresh) {
          setTimeout(() => onRefresh(), 200);
        }
      }
    } catch (error) {
      console.error("Error moving deal to next stage:", error);
      toast({
        title: "Error",
        description: "Failed to move deal to next stage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToFinalStage = async (finalStage: DealStage) => {
    setLoading(true);
    
    try {
      console.log(`Moving deal to final stage: ${finalStage}`);
      
      const updatedData = {
        ...formData,
        stage: finalStage,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      setFormData(updatedData);
      await onSave(updatedData);
      
      toast({
        title: "Success",
        description: `Deal moved to ${finalStage} stage`,
      });
      
      onClose();
      if (onRefresh) {
        setTimeout(() => onRefresh(), 200);
      }
    } catch (error) {
      console.error("Error moving deal to final stage:", error);
      toast({
        title: "Error",
        description: `Failed to move deal to ${finalStage} stage`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToSpecificStage = async (targetStage: DealStage) => {
    if (!canMoveToStage(targetStage)) return;
    
    setLoading(true);
    
    try {
      console.log(`Moving deal from ${currentStage} to ${targetStage}`);
      
      const updatedData = {
        ...formData,
        stage: targetStage,
        deal_name: formData.project_name || formData.deal_name || 'Untitled Deal',
        modified_at: new Date().toISOString(),
        modified_by: deal?.created_by || formData.created_by
      };
      
      setFormData(updatedData);
      await onSave(updatedData);
      
      toast({
        title: "Success",
        description: `Deal moved to ${targetStage} stage`,
      });
      
      onClose();
      if (onRefresh) {
        setTimeout(() => onRefresh(), 200);
      }
    } catch (error) {
      console.error("Error moving deal to stage:", error);
      toast({
        title: "Error",
        description: `Failed to move deal to ${targetStage} stage`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStagesForMoveTo = (): DealStage[] => {
    const currentIndex = getStageIndex(currentStage);
    const allStages: DealStage[] = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
    
    const availableStages: DealStage[] = [];
    
    // Add all previous stages (backward movement)
    for (let i = 0; i < currentIndex; i++) {
      availableStages.push(allStages[i]);
    }
    
    // Add next stage if it exists and requirements are met
    const nextStage = getNextStage(currentStage);
    if (nextStage && validateRequiredFields(formData, currentStage) && 
        validateDateLogic(formData).isValid && 
        (currentStage !== 'Won' || validateRevenueSum(formData).isValid)) {
      availableStages.push(nextStage);
    }
    
    // Add final stages if in Offered stage and requirements are met
    if (currentStage === 'Offered' && validateRequiredFields(formData, currentStage) && 
        validateDateLogic(formData).isValid) {
      availableStages.push('Won', 'Lost', 'Dropped');
    }
    
    return availableStages;
  };

  const canMoveToStage = (targetStage: DealStage): boolean => {
    const availableStages = getAvailableStagesForMoveTo();
    return availableStages.includes(targetStage);
  };

  const canMoveToNextStage = !isCreating && 
    getNextStage(currentStage) !== null && 
    validateRequiredFields(formData, currentStage) &&
    validateDateLogic(formData).isValid &&
    (currentStage !== 'Won' || validateRevenueSum(formData).isValid);

  const canMoveToFinalStage = !isCreating && 
    currentStage === 'Offered' && 
    validateRequiredFields(formData, currentStage) &&
    validateDateLogic(formData).isValid;

  // Remove validation requirements for saving - allow saving with incomplete data
  const canSave = validateDateLogic(formData).isValid &&
    (currentStage !== 'Won' || validateRevenueSum(formData).isValid) &&
    validateLeadConversionRequiredFields(formData);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {isCreating ? (leadData ? 'Convert Lead to Deal' : 'Create New Deal') : formData.project_name || 'Edit Deal'}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {currentStage}
                </Badge>
                {!isCreating && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      console.log("Toggle button clicked! Current state:", showPreviousStages);
                      setShowPreviousStages(!showPreviousStages);
                      console.log("New state will be:", !showPreviousStages);
                    }}
                  >
                    {showPreviousStages ? 'Hide Previous Stages' : 'Show All Stages'}
                  </Button>
                )}
              </div>
              {leadData && isCreating && (
                <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                  Converting lead "{leadData.lead_name}" to deal. Please fill in Project Name and Priority.
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <DealStageForm
            formData={formData}
            onFieldChange={handleFieldChange}
            onLeadSelect={handleLeadSelect}
            fieldErrors={fieldErrors}
            stage={currentStage}
            showPreviousStages={showPreviousStages}
            isLeadConversion={!!leadData && isCreating}
          />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !canSave} className="btn-primary">
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>

            <div className="flex gap-2">
              {/* Move to Stage Dropdown */}
              {!isCreating && getAvailableStagesForMoveTo().length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Move to:</span>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value === 'Won' || value === 'Lost' || value === 'Dropped') {
                        handleMoveToFinalStage(value as DealStage);
                      } else {
                        handleMoveToSpecificStage(value as DealStage);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableStagesForMoveTo().map(stage => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Validation Message - Only for stage progression */}
              {!isCreating && (!validateRequiredFields(formData, currentStage) || 
                !validateDateLogic(formData).isValid || 
                (currentStage === 'Won' && !validateRevenueSum(formData).isValid)) && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                  {!validateDateLogic(formData).isValid ? 
                    validateDateLogic(formData).error : 
                    (currentStage === 'Won' && !validateRevenueSum(formData).isValid) ?
                      validateRevenueSum(formData).error :
                      "Complete all required fields to enable stage progression"
                  }
                </div>
              )}

              {/* Lead Conversion Validation Message */}
              {leadData && isCreating && !validateLeadConversionRequiredFields(formData) && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                  Project Name and Priority are required for lead conversion
                </div>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

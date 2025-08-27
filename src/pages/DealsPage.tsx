import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Deal, DealStage } from "@/types/deal";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { DealForm } from "@/components/DealForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, LayoutGrid, List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";
import { DealActionsDropdown } from "@/components/DealActionsDropdown";

const DealsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logCreate, logUpdate, logBulkDelete } = useCRUDAudit();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [initialStage, setInitialStage] = useState<DealStage>('Lead');
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('list');

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('modified_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching deals:', error);
        toast({
          title: "Error",
          description: "Failed to fetch deals",
          variant: "destructive",
        });
        return;
      }

      setDeals((data || []) as unknown as Deal[]);
    } catch (error) {
      console.error('Unexpected error fetching deals:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeal = async (dealId: string, updates: Partial<Deal>) => {
    try {
      console.log("=== HANDLE UPDATE DEAL DEBUG ===");
      console.log("Deal ID:", dealId);
      console.log("Updates:", updates);
      
      // Get the existing deal for audit logging
      const existingDeal = deals.find(deal => deal.id === dealId);
      
      // Ensure we have all required fields for the update
      const updateData = {
        ...updates,
        modified_at: new Date().toISOString(),
        modified_by: user?.id
      };

      console.log("Final update data:", updateData);

      const { data, error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', dealId)
        .select()
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log("Update successful, data:", data);
      
      // Log update operation
      await logUpdate('deals', dealId, updates, existingDeal);
      
      // Update local state
      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? { ...deal, ...updateData } : deal
      ));
      
      toast({
        title: "Success",
        description: "Deal updated successfully",
      });
    } catch (error: any) {
      console.error("Update deal error:", error);
      toast({
        title: "Error",
        description: `Failed to update deal: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSaveDeal = async (dealData: Partial<Deal>) => {
    try {
      console.log("=== SAVE DEAL DEBUG ===");
      console.log("Is creating:", isCreating);
      console.log("Deal data:", dealData);
      
      if (isCreating) {
        const insertData = { 
          ...dealData, 
          deal_name: dealData.project_name || dealData.deal_name || 'Untitled Deal',
          created_by: user?.id, // Ensure created_by is set for RLS
          modified_by: user?.id,
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString()
        };
        
        console.log("Insert data:", insertData);

        const { data, error } = await supabase
          .from('deals')
          .insert([insertData])
          .select()
          .single();

        if (error) {
          console.error("Insert error:", error);
          
          // Check for RLS policy violation
          if (error.message?.includes('row-level security') || 
              error.message?.includes('permission') ||
              error.code === 'PGRST301' || 
              error.code === '42501') {
            toast({
              title: "Permission Denied",
              description: "You don't have permission to create deals.",
              variant: "destructive",
            });
            return;
          }
          
          throw error;
        }

        console.log("Insert successful:", data);

        // Log create operation
        await logCreate('deals', data.id, dealData);

        setDeals(prev => [data as unknown as Deal, ...prev]);
      } else if (selectedDeal) {
        const updateData = {
          ...dealData,
          deal_name: dealData.project_name || selectedDeal.project_name || selectedDeal.deal_name || 'Untitled Deal',
          modified_at: new Date().toISOString(),
          modified_by: user?.id
        };
        
        console.log("Update data for existing deal:", updateData);
        
        await handleUpdateDeal(selectedDeal.id, updateData);
        await fetchDeals();
      }
    } catch (error: any) {
      console.error("Error in handleSaveDeal:", error);
      throw error;
    }
  };

  const handleDeleteDeals = async (dealIds: string[]) => {
    try {
      console.log("Attempting to delete deals:", dealIds);

      // Request the IDs of the rows that were actually deleted (RLS will filter)
      const { data, error } = await supabase
        .from('deals')
        .delete()
        .in('id', dealIds)
        .select('id');

      if (error) {
        console.error("Delete error:", error);
        toast({
          title: "Error",
          description: "Failed to delete deals",
          variant: "destructive",
        });
        return;
      }

      const deletedIds = (data || []).map((row: { id: string }) => row.id);
      const notDeleted = dealIds.filter(id => !deletedIds.includes(id));

      console.log("Deleted IDs:", deletedIds);
      console.log("Not deleted due to RLS/permissions:", notDeleted);

      // Update local state only for deals that were actually deleted
      if (deletedIds.length > 0) {
        setDeals(prev => prev.filter(deal => !deletedIds.includes(deal.id)));

        // Log bulk delete with only the successfully deleted IDs
        await logBulkDelete('deals', deletedIds.length, deletedIds);

        toast({
          title: "Success",
          description: `Deleted ${deletedIds.length} deal(s)`,
        });
      }

      // Show a clear permission message for deals that couldn't be deleted
      if (notDeleted.length > 0) {
        toast({
          title: "Permission Denied",
          description: `You don't have permission to delete ${notDeleted.length} deal(s).`,
          variant: "destructive",
        });
      }

      // If nothing was deleted at all, ensure user is informed
      if (deletedIds.length === 0 && notDeleted.length === dealIds.length) {
        console.warn("No deals were deleted due to RLS. User may be non-owner/non-admin.");
      }
    } catch (error) {
      console.error("Unexpected delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete deals",
        variant: "destructive",
      });
    }
  };

  const handleImportDeals = async (importedDeals: (Partial<Deal> & { shouldUpdate?: boolean })[]) => {
    // This function is kept for compatibility but the actual import logic is now handled
    // by the simplified CSV processor in useDealsImportExport hook
    console.log('handleImportDeals called with:', importedDeals.length, 'deals');
    // Refresh data after import
    await fetchDeals();
  };

  const handleCreateDeal = (stage: DealStage) => {
    setInitialStage(stage);
    setIsCreating(true);
    setSelectedDeal(null);
    setIsFormOpen(true);
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsCreating(false);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedDeal(null);
    setIsCreating(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDeals();

      // Set up real-time subscription
      const channel = supabase
        .channel('deals-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deals'
          },
          (payload) => {
            console.log('Real-time deal change:', payload);
            
            if (payload.eventType === 'INSERT') {
              setDeals(prev => [payload.new as Deal, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setDeals(prev => prev.map(deal => 
                deal.id === payload.new.id ? { ...deal, ...payload.new } as Deal : deal
              ));
            } else if (payload.eventType === 'DELETE') {
              setDeals(prev => prev.filter(deal => deal.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Listen for custom import events
      const handleImportEvent = () => {
        console.log('DealsPage: Received deals-data-updated event, refreshing...');
        fetchDeals();
      };
      
      window.addEventListener('deals-data-updated', handleImportEvent);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('deals-data-updated', handleImportEvent);
      };
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-background border-b">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Deals</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
              <div className="bg-muted rounded-lg p-1 flex">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeView === 'kanban' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setActiveView('kanban')}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Kanban View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activeView === 'list' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setActiveView('list')}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>List View</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Actions icon-only button between view toggle and Add Deal */}
              <DealActionsDropdown
                deals={deals}
                onImport={handleImportDeals}
                onRefresh={fetchDeals}
                selectedDeals={[]}
                showColumns={activeView === 'list'}
                onColumnCustomize={() => {
                  // Broadcast to open Columns UI in ListView if applicable
                  window.dispatchEvent(new CustomEvent('open-deal-columns'));
                }}
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      size="icon"
                      onClick={() => handleCreateDeal('Lead')}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New Deal</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Takes remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === 'kanban' ? (
          <KanbanBoard
            deals={deals}
            onUpdateDeal={handleUpdateDeal}
            onDealClick={handleDealClick}
            onCreateDeal={handleCreateDeal}
            onDeleteDeals={handleDeleteDeals}
            onImportDeals={handleImportDeals}
            onRefresh={fetchDeals}
          />
        ) : (
          <ListView
            deals={deals}
            onDealClick={handleDealClick}
            onUpdateDeal={handleUpdateDeal}
            onDeleteDeals={handleDeleteDeals}
            onImportDeals={handleImportDeals}
          />
        )}
      </div>

      {/* Deal Form Modal */}
      <DealForm
        deal={selectedDeal}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSave={handleSaveDeal}
        onRefresh={fetchDeals}
        isCreating={isCreating}
        initialStage={initialStage}
      />
    </div>
  );
};

export default DealsPage;

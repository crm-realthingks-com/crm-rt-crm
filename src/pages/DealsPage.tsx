import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Deal, DealStage } from "@/types/deal";
import { DealFilters } from "@/types/filters";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { DealForm } from "@/components/DealForm";
import { DealsFilterPanel } from "@/components/deal-filters/DealsFilterPanel";
import { Button } from "@/components/ui/button";
import { ImportExportBar } from "@/components/ImportExportBar";
import { ColumnCustomizer, ColumnConfig } from "@/components/ColumnCustomizer";
import { useToast } from "@/hooks/use-toast";
import { useFilteredDeals } from "@/hooks/useFilteredDeals";
import { Plus, Columns } from "lucide-react";

const DealsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [initialStage, setInitialStage] = useState<DealStage>('Lead');
  const [activeView, setActiveView] = useState<'kanban' | 'list'>('kanban');
  const [filters, setFilters] = useState<DealFilters>({});
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { field: 'project_name', label: 'Project', visible: true, order: 0 },
    { field: 'customer_name', label: 'Customer', visible: true, order: 1 },
    { field: 'lead_owner', label: 'Lead Owner', visible: true, order: 2 },
    { field: 'stage', label: 'Stage', visible: true, order: 3 },
    { field: 'priority', label: 'Priority', visible: true, order: 4 },
    { field: 'total_contract_value', label: 'Value', visible: true, order: 5 },
    { field: 'expected_closing_date', label: 'Expected Close', visible: true, order: 6 },
    
    { field: 'lead_name', label: 'Lead Name', visible: false, order: 7 },
    { field: 'region', label: 'Region', visible: false, order: 8 },
    { field: 'probability', label: 'Probability', visible: false, order: 9 },
    { field: 'internal_comment', label: 'Comment', visible: false, order: 10 },
    { field: 'customer_need', label: 'Customer Need', visible: false, order: 11 },
    { field: 'customer_challenges', label: 'Customer Challenges', visible: false, order: 12 },
    { field: 'relationship_strength', label: 'Relationship Strength', visible: false, order: 13 },
    { field: 'budget', label: 'Budget', visible: false, order: 14 },
    { field: 'business_value', label: 'Business Value', visible: false, order: 15 },
    { field: 'decision_maker_level', label: 'Decision Maker Level', visible: false, order: 16 },
    { field: 'is_recurring', label: 'Is Recurring', visible: false, order: 17 },
    { field: 'project_duration', label: 'Duration', visible: false, order: 18 },
    { field: 'start_date', label: 'Start Date', visible: false, order: 19 },
    { field: 'end_date', label: 'End Date', visible: false, order: 20 },
    { field: 'rfq_received_date', label: 'RFQ Received', visible: false, order: 21 },
    { field: 'proposal_due_date', label: 'Proposal Due', visible: false, order: 22 },
    { field: 'rfq_status', label: 'RFQ Status', visible: false, order: 23 },
    { field: 'currency_type', label: 'Currency', visible: false, order: 24 },
    { field: 'action_items', label: 'Action Items', visible: false, order: 25 },
    { field: 'current_status', label: 'Current Status', visible: false, order: 26 },
    { field: 'closing', label: 'Closing', visible: false, order: 27 },
    { field: 'won_reason', label: 'Won Reason', visible: false, order: 28 },
    { field: 'lost_reason', label: 'Lost Reason', visible: false, order: 29 },
    { field: 'need_improvement', label: 'Need Improvement', visible: false, order: 30 },
    { field: 'drop_reason', label: 'Drop Reason', visible: false, order: 31 },
    { field: 'created_at', label: 'Created', visible: false, order: 32 },
    { field: 'modified_at', label: 'Updated', visible: false, order: 33 },
  ]);

  // Use the filtered deals hook
  const { filteredDeals, uniqueValues } = useFilteredDeals(deals, filters);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('modified_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch deals",
          variant: "destructive",
        });
        return;
      }

      setDeals((data || []) as unknown as Deal[]);
    } catch (error) {
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
      const { error } = await supabase
        .from('deals')
        .update({ ...updates, modified_at: new Date().toISOString() })
        .eq('id', dealId);

      if (error) throw error;

      setDeals(prev => prev.map(deal => 
        deal.id === dealId ? { ...deal, ...updates } : deal
      ));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update deal",
        variant: "destructive",
      });
    }
  };

  const handleSaveDeal = async (dealData: Partial<Deal>) => {
    try {
      if (isCreating) {
        const { data, error } = await supabase
          .from('deals')
          .insert([{ 
            ...dealData, 
            deal_name: dealData.project_name || 'Untitled Deal',
            created_by: user?.id,
            modified_by: user?.id 
          }])
          .select()
          .single();

        if (error) throw error;

        setDeals(prev => [data as unknown as Deal, ...prev]);
      } else if (selectedDeal) {
        const updateData = {
          ...dealData,
          deal_name: dealData.project_name || selectedDeal.project_name || 'Untitled Deal',
          modified_at: new Date().toISOString(),
          modified_by: user?.id
        };
        
        await handleUpdateDeal(selectedDeal.id, updateData);
        await fetchDeals();
      }
    } catch (error) {
      console.error("Error in handleSaveDeal:", error);
      throw error;
    }
  };

  const handleDeleteDeals = async (dealIds: string[]) => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .in('id', dealIds);

      if (error) throw error;

      setDeals(prev => prev.filter(deal => !dealIds.includes(deal.id)));
      
      toast({
        title: "Success",
        description: `Deleted ${dealIds.length} deal(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deals",
        variant: "destructive",
      });
    }
  };

  const handleImportDeals = async (importedDeals: (Partial<Deal> & { shouldUpdate?: boolean })[]) => {
    try {
      let createdCount = 0;
      let updatedCount = 0;

      for (const importDeal of importedDeals) {
        const { shouldUpdate, ...dealData } = importDeal;
        
        const existingDeal = deals.find(d => 
          (dealData.id && d.id === dealData.id) || 
          (dealData.project_name && d.project_name === dealData.project_name)
        );

        if (existingDeal) {
          const { data, error } = await supabase
            .from('deals')
            .update({
              ...dealData,
              modified_by: user?.id,
              deal_name: dealData.project_name || existingDeal.deal_name
            })
            .eq('id', existingDeal.id)
            .select()
            .single();

          if (error) throw error;
          updatedCount++;
        } else {
          const newDealData = {
            ...dealData,
            stage: dealData.stage || 'Lead' as const,
            created_by: user?.id,
            modified_by: user?.id,
            deal_name: dealData.project_name || `Imported Deal ${Date.now()}`
          };

          const { data, error } = await supabase
            .from('deals')
            .insert(newDealData)
            .select()
            .single();

          if (error) throw error;
          createdCount++;
        }
      }

      await fetchDeals();
      
      toast({
        title: "Import successful",
        description: `Created ${createdCount} new deals, updated ${updatedCount} existing deals`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import deals. Please check the CSV format.",
        variant: "destructive",
      });
    }
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
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    <div className="w-full h-screen overflow-hidden bg-background">
      {/* Compact Header */}
      <div className="w-full bg-background border-b">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h1 className="text-2xl font-bold text-foreground">Deals Pipeline</h1>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {filteredDeals.length} deals
              </span>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <ImportExportBar
                deals={filteredDeals}
                onImport={handleImportDeals}
                onExport={() => {}}
                selectedDeals={[]}
                onRefresh={fetchDeals}
              />
              
              {/* Columns button - moved to the right side, only shown in list view */}
              {activeView === 'list' && (
                <ColumnCustomizer
                  columns={columns}
                  onUpdate={setColumns}
                />
              )}
              
              <div className="bg-muted rounded-lg p-1 flex">
                <Button
                  variant={activeView === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('kanban')}
                  className={`h-8 px-3 text-sm ${activeView === 'kanban' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  Kanban
                </Button>
                <Button
                  variant={activeView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('list')}
                  className={`h-8 px-3 text-sm ${activeView === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  List
                </Button>
              </div>
              
              <Button 
                onClick={() => handleCreateDeal('Lead')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Deal
              </Button>
            </div>
          </div>

          {/* Only show filters panel in List view */}
          {activeView === 'list' && (
            <div className="mt-3">
              <DealsFilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                uniqueValues={uniqueValues}
                onRefresh={fetchDeals}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full" style={{ height: activeView === 'list' ? 'calc(100vh - 140px)' : 'calc(100vh - 100px)' }}>
        {activeView === 'kanban' ? (
          <KanbanBoard
            deals={filteredDeals}
            onUpdateDeal={handleUpdateDeal}
            onDealClick={handleDealClick}
            onCreateDeal={handleCreateDeal}
            onDeleteDeals={handleDeleteDeals}
            onImportDeals={handleImportDeals}
            onRefresh={fetchDeals}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <ListView
              deals={filteredDeals}
              onDealClick={handleDealClick}
              onUpdateDeal={handleUpdateDeal}
              onDeleteDeals={handleDeleteDeals}
              onImportDeals={handleImportDeals}
              columns={columns}
              onColumnsChange={setColumns}
            />
          </div>
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

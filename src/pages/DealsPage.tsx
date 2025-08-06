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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportExportBar } from "@/components/ImportExportBar";
import { useToast } from "@/hooks/use-toast";
import { useFilteredDeals } from "@/hooks/useFilteredDeals";
import { Plus, BarChart3, Users, Euro } from "lucide-react";

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

  const getStats = () => {
    const totalDeals = filteredDeals.length;
    const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.total_contract_value || 0), 0);
    const wonDeals = filteredDeals.filter(deal => deal.stage === 'Won').length;
    
    return { totalDeals, totalValue, wonDeals };
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

  const stats = getStats();

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      {/* Fixed Header */}
      <div className="w-full bg-background border-b">
        <div className="w-full px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Deals Pipeline</h1>
              
              {/* Only show stats cards in Kanban view */}
              {activeView === 'kanban' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Deals</p>
                          <p className="text-2xl font-bold">{stats.totalDeals}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Euro className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Value</p>
                          <p className="text-2xl font-bold">€{stats.totalValue.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Won Deals</p>
                          <p className="text-2xl font-bold">{stats.wonDeals}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
              <div className="hidden sm:block">
                <ImportExportBar
                  deals={filteredDeals}
                  onImport={handleImportDeals}
                  onExport={() => {}}
                  selectedDeals={[]}
                  onRefresh={fetchDeals}
                />
              </div>
              <div className="bg-muted rounded-lg p-1 flex">
                <Button
                  variant={activeView === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('kanban')}
                  className={activeView === 'kanban' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Kanban
                </Button>
                <Button
                  variant={activeView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('list')}
                  className={activeView === 'list' ? 'bg-primary text-primary-foreground' : ''}
                >
                  List
                </Button>
              </div>
              <Button 
                onClick={() => handleCreateDeal('Lead')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">New Deal</span>
              </Button>
            </div>
          </div>

          {/* Only show filters panel in List view */}
          {activeView === 'list' && (
            <DealsFilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              uniqueValues={uniqueValues}
            />
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full" style={{ height: activeView === 'list' ? 'calc(100vh - 250px)' : 'calc(100vh - 350px)' }}>
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
          <div className="h-full overflow-y-auto p-4">
            <ListView
              deals={filteredDeals}
              onDealClick={handleDealClick}
              onUpdateDeal={handleUpdateDeal}
              onDeleteDeals={handleDeleteDeals}
              onImportDeals={handleImportDeals}
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

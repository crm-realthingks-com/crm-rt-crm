import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DealFilters, SavedFilter } from "@/types/filters";
import { Save, Download, Trash2 } from "lucide-react";

interface SavedFiltersManagerProps {
  currentFilters: DealFilters;
  onLoadFilters: (filters: DealFilters) => void;
}

export const SavedFiltersManager = ({ currentFilters, onLoadFilters }: SavedFiltersManagerProps) => {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [selectedFilterId, setSelectedFilterId] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSavedFilters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_deal_filters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        filters: item.filters as DealFilters
      })) as SavedFilter[];
      
      setSavedFilters(typedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch saved filters",
        variant: "destructive",
      });
    }
  };

  const saveFilter = async () => {
    if (!user || !filterName.trim()) return;

    try {
      const { error } = await supabase
        .from('saved_deal_filters')
        .insert({
          user_id: user.id,
          name: filterName.trim(),
          filters: currentFilters as any
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Filter saved successfully",
      });

      setFilterName('');
      setSaveDialogOpen(false);
      fetchSavedFilters();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save filter",
        variant: "destructive",
      });
    }
  };

  const loadFilter = () => {
    const filter = savedFilters.find(f => f.id === selectedFilterId);
    if (filter) {
      onLoadFilters(filter.filters);
      setLoadDialogOpen(false);
      toast({
        title: "Success",
        description: `Loaded filter: ${filter.name}`,
      });
    }
  };

  const deleteFilter = async (filterId: string) => {
    try {
      const { error } = await supabase
        .from('saved_deal_filters')
        .delete()
        .eq('id', filterId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Filter deleted successfully",
      });

      fetchSavedFilters();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete filter",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSavedFilters();
  }, [user]);

  return (
    <div className="flex gap-2">
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Save className="w-3 h-3 mr-1" />
            Save Filter
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Filter Name</Label>
              <Input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Enter filter name"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveFilter} disabled={!filterName.trim()}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="w-3 h-3 mr-1" />
            Load Filter
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Saved Filter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Filter</Label>
              <Select value={selectedFilterId} onValueChange={setSelectedFilterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved filter" />
                </SelectTrigger>
                <SelectContent>
                  {savedFilters.map(filter => (
                    <SelectItem key={filter.id} value={filter.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{filter.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFilter(filter.id);
                          }}
                          className="ml-2 p-1 h-6 w-6"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadFilter} disabled={!selectedFilterId}>
                Load
              </Button>
              <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

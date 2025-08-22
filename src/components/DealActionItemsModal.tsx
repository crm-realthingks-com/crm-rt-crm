
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";

interface Deal {
  id: string;
  deal_name: string;
  project_name?: string;
}

interface DealActionItem {
  id: string;
  deal_id: string;
  next_action: string;
  assigned_to: string | null;
  due_date: string | null;
  status: 'Open' | 'Ongoing' | 'Closed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface DealActionItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
}

export const DealActionItemsModal = ({ open, onOpenChange, deal }: DealActionItemsModalProps) => {
  const { toast } = useToast();
  const { logCreate, logUpdate, logDelete } = useCRUDAudit();
  const [actionItems, setActionItems] = useState<DealActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<DealActionItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [nextAction, setNextAction] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<'Open' | 'Ongoing' | 'Closed'>('Open');

  // Get all users for the dropdown
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);
  const userIds = allUsers.map(u => u.id);
  const { displayNames } = useUserDisplayNames(userIds);

  useEffect(() => {
    if (open && deal) {
      fetchActionItems();
      fetchUsers();
    }
  }, [open, deal]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');
      
      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchActionItems = async () => {
    if (!deal) return;
    
    try {
      setLoading(true);
      // Use type assertion to work around TypeScript issues until types are regenerated
      const { data, error } = await (supabase as any)
        .from('deal_action_items')
        .select('*')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the data to ensure status field matches our interface
      const typedData = (data || []).map((item: any) => ({
        ...item,
        status: item.status as 'Open' | 'Ongoing' | 'Closed'
      }));
      
      setActionItems(typedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch action items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNextAction("");
    setAssignedTo("");
    setDueDate(undefined);
    setStatus('Open');
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !nextAction.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const actionItemData = {
        deal_id: deal.id,
        next_action: nextAction.trim(),
        assigned_to: assignedTo === "unassigned" ? null : assignedTo,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        status,
        created_by: user.id
      };

      if (editingItem) {
        // Update existing item
        const { error } = await (supabase as any)
          .from('deal_action_items')
          .update({
            next_action: nextAction.trim(),
            assigned_to: assignedTo === "unassigned" ? null : assignedTo,
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
            status
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        await logUpdate('deal_action_items', editingItem.id, actionItemData, editingItem);

        toast({
          title: "Success",
          description: "Action item updated successfully"
        });
      } else {
        // Create new item
        const { data, error } = await (supabase as any)
          .from('deal_action_items')
          .insert([actionItemData])
          .select()
          .single();

        if (error) throw error;

        await logCreate('deal_action_items', data.id, actionItemData);

        toast({
          title: "Success",
          description: "Action item created successfully"
        });
      }

      resetForm();
      fetchActionItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save action item",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: DealActionItem) => {
    setEditingItem(item);
    setNextAction(item.next_action);
    setAssignedTo(item.assigned_to || "unassigned");
    setDueDate(item.due_date ? new Date(item.due_date) : undefined);
    setStatus(item.status);
    setShowForm(true);
  };

  const handleDelete = async (item: DealActionItem) => {
    try {
      const { error } = await (supabase as any)
        .from('deal_action_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      await logDelete('deal_action_items', item.id, item);

      toast({
        title: "Success",
        description: "Action item deleted successfully"
      });

      fetchActionItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete action item",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'Ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Action Items - {deal?.project_name || deal?.deal_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Action Item Button */}
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add New Action Item
            </Button>
          )}

          {/* Action Item Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Edit Action Item' : 'New Action Item'}
              </h3>
              
              <div>
                <Label htmlFor="next_action">Next Action *</Label>
                <Textarea
                  id="next_action"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  placeholder="Describe the next action to be taken..."
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {displayNames[user.id] || user.full_name || 'Unknown User'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value: 'Open' | 'Ongoing' | 'Closed') => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingItem ? 'Update' : 'Create'} Action Item
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Action Items List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing Action Items</h3>
            
            {loading ? (
              <div className="text-center py-4">Loading action items...</div>
            ) : actionItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No action items found for this deal.
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium mb-2">{item.next_action}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Assigned to:</span>{' '}
                            {item.assigned_to ? (displayNames[item.assigned_to] || 'Loading...') : 'Unassigned'}
                          </div>
                          <div>
                            <span className="font-medium">Due Date:</span>{' '}
                            {item.due_date ? format(new Date(item.due_date), 'PPP') : 'No due date'}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>{' '}
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

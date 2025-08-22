import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RefreshCw, ListTodo } from "lucide-react";
import { LeadModal } from "./LeadModal";
import { LeadColumnCustomizer, LeadColumnConfig } from "./LeadColumnCustomizer";
import { LeadStatusFilter } from "./LeadStatusFilter";
import { ConvertToDealModal } from "./ConvertToDealModal";
import { LeadActionItemsModal } from "./LeadActionItemsModal";
import { LeadDeleteConfirmDialog } from "./LeadDeleteConfirmDialog";

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  country?: string;
  contact_owner?: string;
  created_time?: string;
  modified_time?: string;
  lead_status?: string;
  industry?: string;
  contact_source?: string;
  linkedin?: string;
  website?: string;
  description?: string;
  created_by?: string;
  modified_by?: string;
}

const defaultColumns: LeadColumnConfig[] = [{
  field: 'lead_name',
  label: 'Lead Name',
  visible: true,
  order: 0
}, {
  field: 'company_name',
  label: 'Company Name',
  visible: true,
  order: 1
}, {
  field: 'position',
  label: 'Position',
  visible: true,
  order: 2
}, {
  field: 'email',
  label: 'Email',
  visible: true,
  order: 3
}, {
  field: 'phone_no',
  label: 'Phone',
  visible: true,
  order: 4
}, {
  field: 'country',
  label: 'Region',
  visible: true,
  order: 5
}, {
  field: 'contact_owner',
  label: 'Lead Owner',
  visible: true,
  order: 6
}, {
  field: 'lead_status',
  label: 'Lead Status',
  visible: true,
  order: 7
}, {
  field: 'industry',
  label: 'Industry',
  visible: false,
  order: 8
}, {
  field: 'contact_source',
  label: 'Source',
  visible: false,
  order: 9
}];

interface LeadTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedLeads: string[];
  setSelectedLeads: React.Dispatch<React.SetStateAction<string[]>>;
}

const LeadTable = ({
  showColumnCustomizer,
  setShowColumnCustomizer,
  showModal,
  setShowModal,
  selectedLeads,
  setSelectedLeads
}: LeadTableProps) => {
  const {
    toast
  } = useToast();
  const { logDelete } = useCRUDAudit();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("New");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [columns, setColumns] = useState(defaultColumns);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showActionItemsModal, setShowActionItemsModal] = useState(false);
  const [selectedLeadForActions, setSelectedLeadForActions] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let filtered = leads.filter(lead => lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) || lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || lead.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== "all") {
      filtered = filtered.filter(lead => lead.lead_status === statusFilter);
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField as keyof Lead] || '';
        const bValue = b[sortField as keyof Lead] || '';
        const comparison = aValue.toString().localeCompare(bValue.toString());
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [leads, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('leads').select('*').order('created_time', {
        ascending: false
      });
      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deleteLinkedRecords: boolean = true) => {
    // Add validation to ensure leadToDelete exists and has a valid id
    if (!leadToDelete) {
      console.error('No lead selected for deletion');
      toast({
        title: "Error",
        description: "No lead selected for deletion",
        variant: "destructive"
      });
      return;
    }

    if (!leadToDelete.id) {
      console.error('Lead ID is undefined:', leadToDelete);
      toast({
        title: "Error",
        description: "Invalid lead ID",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Starting lead deletion process for ID:', leadToDelete.id);
      
      if (deleteLinkedRecords) {
        // First, delete ALL notifications related to this lead (both direct and through action items)
        console.log('Deleting all notifications for this lead...');
        const { error: allNotificationsError } = await supabase
          .from('notifications')
          .delete()
          .or(`lead_id.eq.${leadToDelete.id},action_item_id.in.(select id from lead_action_items where lead_id = '${leadToDelete.id}')`);

        if (allNotificationsError) {
          console.error('Error deleting notifications:', allNotificationsError);
          // Try alternative approach - delete by lead_id first, then by action_item_id
          
          // Delete notifications by lead_id
          await supabase
            .from('notifications')
            .delete()
            .eq('lead_id', leadToDelete.id);

          // Get action items and delete notifications for them
          const { data: actionItems } = await supabase
            .from('lead_action_items')
            .select('id')
            .eq('lead_id', leadToDelete.id);
          
          if (actionItems && actionItems.length > 0) {
            const actionItemIds = actionItems.map(item => item.id);
            await supabase
              .from('notifications')
              .delete()
              .in('action_item_id', actionItemIds);
          }
        }

        // Now delete lead action items
        console.log('Deleting lead action items...');
        const { error: actionItemsError } = await supabase
          .from('lead_action_items')
          .delete()
          .eq('lead_id', leadToDelete.id);

        if (actionItemsError) {
          console.error('Error deleting lead action items:', actionItemsError);
          throw actionItemsError;
        }
      }

      // Finally delete the lead itself
      console.log('Deleting the lead...');
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadToDelete.id);
        
      if (error) throw error;

      // Log delete operation
      await logDelete('leads', leadToDelete.id, leadToDelete);

      console.log('Lead deletion completed successfully');
      toast({
        title: "Success",
        description: "Lead deleted successfully"
      });
      fetchLeads();
      setLeadToDelete(null);
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead",
        variant: "destructive"
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageLeads = getCurrentPageLeads().slice(0, 50);
      setSelectedLeads(pageLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const getCurrentPageLeads = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  // Memoize user IDs to prevent unnecessary re-fetches
  const createdByIds = useMemo(() => {
    return [...new Set(leads.map(l => l.created_by).filter(Boolean))];
  }, [leads]);

  // Use the optimized hook
  const {
    displayNames
  } = useUserDisplayNames(createdByIds);

  const visibleColumns = columns.filter(col => col.visible);
  const pageLeads = getCurrentPageLeads();

  const handleConvertToDeal = (lead: Lead) => {
    setLeadToConvert(lead);
    setShowConvertModal(true);
  };

  const handleConvertSuccess = async () => {
    // Update the lead status to "Converted" immediately
    if (leadToConvert) {
      try {
        const {
          error
        } = await supabase.from('leads').update({
          lead_status: 'Converted'
        }).eq('id', leadToConvert.id);
        if (error) {
          console.error("Error updating lead status:", error);
        } else {
          // Update local state immediately
          setLeads(prevLeads => prevLeads.map(lead => lead.id === leadToConvert.id ? {
            ...lead,
            lead_status: 'Converted'
          } : lead));
        }
      } catch (error) {
        console.error("Error updating lead status:", error);
      }
    }
    fetchLeads();
    setLeadToConvert(null);
  };

  const handleActionItems = (lead: Lead) => {
    setSelectedLeadForActions(lead);
    setShowActionItemsModal(true);
  };

  return <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 w-80" />
          </div>
          <LeadStatusFilter value={statusFilter} onValueChange={setStatusFilter} />
          <Checkbox checked={selectedLeads.length > 0 && selectedLeads.length === Math.min(pageLeads.length, 50)} onCheckedChange={handleSelectAll} />
          <span className="text-sm text-muted-foreground">Select all</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={selectedLeads.length > 0 && selectedLeads.length === Math.min(pageLeads.length, 50)} onCheckedChange={handleSelectAll} />
              </TableHead>
              {visibleColumns.map(column => <TableHead key={column.field}>
                  <div className="flex items-center gap-2 cursor-pointer hover:text-primary" onClick={() => handleSort(column.field)}>
                    {column.label}
                    {getSortIcon(column.field)}
                  </div>
                </TableHead>)}
              <TableHead>
                <div className="flex items-center gap-2">
                  Actions
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                  Loading leads...
                </TableCell>
              </TableRow> : pageLeads.length === 0 ? <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                  No leads found
                </TableCell>
              </TableRow> : pageLeads.map(lead => <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox checked={selectedLeads.includes(lead.id)} onCheckedChange={checked => handleSelectLead(lead.id, checked as boolean)} />
                  </TableCell>
                  {visibleColumns.map(column => <TableCell key={column.field}>
                      {column.field === 'lead_name' ? <button onClick={() => {
                setEditingLead(lead);
                setShowModal(true);
              }} className="text-primary hover:underline font-medium">
                          {lead[column.field as keyof Lead]}
                        </button> : column.field === 'contact_owner' ? <span>
                          {lead.created_by ? displayNames[lead.created_by] || "Loading..." : '-'}
                        </span> : column.field === 'lead_status' && lead.lead_status ? <Badge variant={lead.lead_status === 'New' ? 'secondary' : lead.lead_status === 'Contacted' ? 'default' : lead.lead_status === 'Converted' ? 'outline' : 'outline'}>
                          {lead.lead_status}
                        </Badge> : lead[column.field as keyof Lead] || '-'}
                    </TableCell>)}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => {
                  setEditingLead(lead);
                  setShowModal(true);
                }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                  console.log('Setting lead to delete:', lead);
                  setLeadToDelete(lead);
                  setShowDeleteDialog(true);
                }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleConvertToDeal(lead)} disabled={lead.lead_status === 'Converted'}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Convert
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleActionItems(lead)}>
                        <ListTodo className="w-4 h-4 mr-1" />
                        Action
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>}

      <LeadModal open={showModal} onOpenChange={setShowModal} lead={editingLead} onSuccess={() => {
      fetchLeads();
      setEditingLead(null);
    }} />

      <LeadColumnCustomizer open={showColumnCustomizer} onOpenChange={setShowColumnCustomizer} columns={columns} onColumnsChange={setColumns} />

      <ConvertToDealModal open={showConvertModal} onOpenChange={setShowConvertModal} lead={leadToConvert} onSuccess={handleConvertSuccess} />

      <LeadActionItemsModal 
        open={showActionItemsModal} 
        onOpenChange={setShowActionItemsModal} 
        lead={selectedLeadForActions} 
      />

      <LeadDeleteConfirmDialog
        open={showDeleteDialog}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setLeadToDelete(null);
        }}
        leadName={leadToDelete?.lead_name}
      />
    </div>;
};

export default LeadTable;

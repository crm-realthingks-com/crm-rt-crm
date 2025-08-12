import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadModal } from "./LeadModal";
import { LeadColumnCustomizer, LeadColumnConfig } from "./LeadColumnCustomizer";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2 } from 'lucide-react';
import { useSorting } from "@/hooks/useSorting";
import { SortableTableHead } from "./SortableTableHead";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";

interface LeadTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedLeads: string[];
  setSelectedLeads: (leads: string[]) => void;
  refreshTrigger?: number;
  onLeadsChange?: (leads: any[]) => void;
}

const defaultColumns: LeadColumnConfig[] = [
  { field: 'lead_name', label: 'Lead Name', visible: true, order: 0 },
  { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
  { field: 'position', label: 'Position', visible: true, order: 2 },
  { field: 'email', label: 'Email', visible: true, order: 3 },
  { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
  { field: 'region', label: 'Region', visible: true, order: 5 },
  { field: 'contact_owner', label: 'Lead Owner', visible: true, order: 6 },
  { field: 'industry', label: 'Industry', visible: false, order: 7 },
  { field: 'lead_source', label: 'Source', visible: false, order: 8 },
  { field: 'status', label: 'Status', visible: false, order: 9 },
];

export const LeadTable = ({
  showColumnCustomizer,
  setShowColumnCustomizer,
  showModal,
  setShowModal,
  selectedLeads,
  setSelectedLeads,
  refreshTrigger = 0,
  onLeadsChange
}: LeadTableProps) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [columns, setColumns] = useState<LeadColumnConfig[]>(defaultColumns);
  const [tableKey, setTableKey] = useState(0); // Force re-render key

  const { user } = useAuth();
  const { toast } = useToast();

  // Get unique contact_owner IDs for fetching display names
  const contactOwnerIds = leads
    .map(lead => lead.contact_owner)
    .filter(Boolean)
    .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

  const { displayNames } = useUserDisplayNames(contactOwnerIds);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('leadTableColumns');
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns);
        console.log('Loading saved columns:', parsedColumns);
        setColumns(parsedColumns);
        setTableKey(prev => prev + 1);
      } catch (error) {
        console.error('Error parsing saved columns:', error);
        setColumns(defaultColumns);
      }
    }
  }, []);

  // Listen for column updates event with more robust handling
  useEffect(() => {
    const handleColumnUpdate = () => {
      console.log('Column update event received');
      const savedColumns = localStorage.getItem('leadTableColumns');
      if (savedColumns) {
        try {
          const parsedColumns = JSON.parse(savedColumns);
          console.log('Applying updated columns:', parsedColumns);
          setColumns(parsedColumns);
          setTableKey(prev => prev + 1); // Force table re-render
        } catch (error) {
          console.error('Error parsing updated columns:', error);
        }
      }
    };

    window.addEventListener('leadColumnsUpdated', handleColumnUpdate);
    return () => window.removeEventListener('leadColumnsUpdated', handleColumnUpdate);
  }, []);

  // Save column preferences to localStorage and force re-render
  const handleColumnsChange = (newColumns: LeadColumnConfig[]) => {
    console.log('Updating columns:', newColumns);
    setColumns(newColumns);
    localStorage.setItem('leadTableColumns', JSON.stringify(newColumns));
    setTableKey(prev => prev + 1); // Force table re-render
  };

  // Get visible columns in the correct order
  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  console.log('Current visible columns:', visibleColumns.map(col => col.field));

  // Filter leads first
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const leadStatus = lead.status || lead.lead_status || 'New';
    const matchesStatus = filterStatus === 'all' || 
      (leadStatus === filterStatus) ||
      (filterStatus === 'New' && (!lead.status && !lead.lead_status));
    
    return matchesSearch && matchesStatus;
  });

  // Apply sorting to filtered leads
  const { sortedData, sortConfig, handleSort } = useSorting(filteredLeads);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) {
        console.error('Error loading leads:', error);
        toast({
          title: "Error",
          description: "Failed to load leads",
          variant: "destructive",
        });
        return;
      }

      console.log('Loaded leads with source and region data:', data);
      setLeads(data || []);
      onLeadsChange?.(data || []);
    } catch (error) {
      console.error('Error in loadLeads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [refreshTrigger]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = sortedData.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(paginatedLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const handleEdit = (lead: any) => {
    setEditingLead(lead);
    setShowModal(true);
  };

  const handleDelete = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });

      loadLeads();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLead(null);
    loadLeads();
  };

  const renderCellValue = (lead: any, field: string) => {
    switch (field) {
      case 'lead_name':
        return <span className="font-medium">{lead.lead_name}</span>;
      case 'company_name':
        return lead.company_name;
      case 'position':
        return lead.position;
      case 'email':
        return lead.email;
      case 'phone_no':
        return lead.phone_no;
      case 'region':
        return lead.region || '-';
      case 'contact_owner':
        return lead.contact_owner ? (displayNames[lead.contact_owner] || 'Loading...') : '-';
      case 'industry':
        return lead.industry || '-';
      case 'lead_source':
        return lead.lead_source || '-';
      case 'status':
        const displayStatus = lead.status || lead.lead_status || 'New';
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${
            displayStatus === 'Qualified' ? 'bg-blue-100 text-blue-800' :
            displayStatus === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {displayStatus}
          </span>
        );
      default:
        return lead[field] || '-';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading leads...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedLeads.length} of {sortedData.length} leads
        {selectedLeads.length > 0 && ` (${selectedLeads.length} selected)`}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table key={tableKey}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {visibleColumns.map((column) => (
                <SortableTableHead
                  key={column.field}
                  field={column.field}
                  label={column.label}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                  />
                </TableCell>
                {visibleColumns.map((column) => (
                  <TableCell key={`${lead.id}-${column.field}`}>
                    {renderCellValue(lead, column.field)}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(lead)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(lead.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <LeadModal 
          open={showModal} 
          onOpenChange={setShowModal}
          lead={editingLead}
          onSuccess={handleModalClose}
        />
      )}

      {showColumnCustomizer && (
        <LeadColumnCustomizer
          open={showColumnCustomizer}
          onOpenChange={setShowColumnCustomizer}
          columns={columns}
          onColumnsChange={handleColumnsChange}
        />
      )}
    </div>
  );
};

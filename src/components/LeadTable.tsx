import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadModal } from "./LeadModal";
import { LeadColumnCustomizer } from "./LeadColumnCustomizer";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2 } from 'lucide-react';
import { useSorting } from "@/hooks/useSorting";
import { SortableTableHead } from "./SortableTableHead";

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

  const { user } = useAuth();
  const { toast } = useToast();

  // Filter leads first
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Use the correct status field and handle null/undefined values
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <SortableTableHead
                field="lead_name"
                label="Lead Name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTableHead
                field="company_name"
                label="Company"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTableHead
                field="email"
                label="Email"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTableHead
                field="phone_no"
                label="Phone"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTableHead
                field="status"
                label="Status"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTableHead
                field="lead_source"
                label="Source"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <SortableTableHead
                field="region"
                label="Region"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLeads.map((lead) => {
              // Use the correct status field, prioritizing 'status' over 'lead_status'
              const displayStatus = lead.status || lead.lead_status || 'New';
              
              return (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lead.lead_name}</TableCell>
                  <TableCell>{lead.company_name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone_no}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      displayStatus === 'Qualified' ? 'bg-blue-100 text-blue-800' :
                      displayStatus === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {displayStatus}
                    </span>
                  </TableCell>
                  <TableCell>{lead.lead_source || '-'}</TableCell>
                  <TableCell>{lead.region || '-'}</TableCell>
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
              );
            })}
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
          columns={[]}
          onColumnsChange={() => {}}
        />
      )}
    </div>
  );
};

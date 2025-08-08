
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContactModal } from "./ContactModal";
import { ContactColumnCustomizer } from "./ContactColumnCustomizer";
import { ContactTableHeader } from "./contact-table/ContactTableHeader";
import { ContactTablePagination } from "./contact-table/ContactTablePagination";
import { ContactTableBody } from "./contact-table/ContactTableBody";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSorting } from '@/hooks/useSorting';
import { SortableTableHead } from './SortableTableHead';
import { Pencil, Trash2, Settings } from 'lucide-react';

interface ContactTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onExportReady: (contacts: any[]) => void;
  selectedContacts: string[];
  setSelectedContacts: (contacts: string[]) => void;
  refreshTrigger?: number;
}

export const ContactTable = ({
  showColumnCustomizer,
  setShowColumnCustomizer,
  showModal,
  setShowModal,
  onExportReady,
  selectedContacts,
  setSelectedContacts,
  refreshTrigger = 0
}: ContactTableProps) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  const { user } = useAuth();
  const { toast } = useToast();

  // Load contacts function
  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) {
        console.error('Error loading contacts:', error);
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive",
        });
        return;
      }

      setContacts(data || []);
      onExportReady(data || []);
    } catch (error) {
      console.error('Error in loadContacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [refreshTrigger]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    if (!searchTerm) return true;
    
    const searchableFields = [
      contact.contact_name,
      contact.company_name,
      contact.email,
      contact.phone_no,
      contact.position,
      contact.country
    ];
    
    return searchableFields.some(field => 
      field && field.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Use sorting hook
  const { sortedData: sortedContacts, sortConfig, handleSort } = useSorting(filteredContacts);

  // Pagination
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = sortedContacts.slice(startIndex, endIndex);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(paginatedContacts.map(contact => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    }
  };

  // CRUD operations
  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const handleDelete = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });

      loadContacts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingContact(null);
    loadContacts();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading contacts...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          onClick={() => setShowColumnCustomizer(true)}
          size="icon"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedContacts.length} of {sortedContacts.length} contacts
        {selectedContacts.length > 0 && ` (${selectedContacts.length} selected)`}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={paginatedContacts.length > 0 && selectedContacts.length === paginatedContacts.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <SortableTableHead
                sortKey="contact_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                Contact Name
              </SortableTableHead>
              <SortableTableHead
                sortKey="company_name"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                Company Name
              </SortableTableHead>
              <SortableTableHead
                sortKey="position"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                Position
              </SortableTableHead>
              <SortableTableHead
                sortKey="email"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                Email
              </SortableTableHead>
              <SortableTableHead
                sortKey="phone_no"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                Phone
              </SortableTableHead>
              <SortableTableHead
                sortKey="country"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                Region
              </SortableTableHead>
              <SortableTableHead
                sortKey="contact_owner"
                sortConfig={sortConfig}
                onSort={handleSort}
              >
                Contact Owner
              </SortableTableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">{contact.contact_name}</TableCell>
                <TableCell>{contact.company_name}</TableCell>
                <TableCell>{contact.position}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone_no}</TableCell>
                <TableCell>{contact.country}</TableCell>
                <TableCell>{contact.contact_owner}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
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
        <ContactModal 
          open={showModal} 
          onOpenChange={setShowModal}
          contact={editingContact}
          onSuccess={handleModalClose}
        />
      )}

      {showColumnCustomizer && (
        <ContactColumnCustomizer
          open={showColumnCustomizer}
          onOpenChange={setShowColumnCustomizer}
          columns={[]}
          onColumnsChange={() => {}}
        />
      )}
    </div>
  );
};

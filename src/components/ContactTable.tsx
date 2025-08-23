
import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContactModal } from "./ContactModal";
import { ContactColumnCustomizer, ContactColumnConfig } from "./ContactColumnCustomizer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, Star, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCRUDAudit } from "@/hooks/useCRUDAudit";

interface ContactTableProps {
  showColumnCustomizer: boolean;
  setShowColumnCustomizer: (show: boolean) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedContacts: string[];
  setSelectedContacts: (contacts: string[]) => void;
  refreshTrigger: number;
}

const defaultColumns: ContactColumnConfig[] = [
  { field: 'contact_name', label: 'Contact Name', visible: true, order: 0 },
  { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
  { field: 'position', label: 'Position', visible: true, order: 2 },
  { field: 'email', label: 'Email', visible: true, order: 3 },
  { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
  { field: 'region', label: 'Region', visible: true, order: 5 },
  { field: 'contact_owner', label: 'Contact Owner', visible: true, order: 6 },
  { field: 'industry', label: 'Industry', visible: true, order: 7 },
  { field: 'contact_source', label: 'Source', visible: true, order: 8 },
];

export const ContactTable = ({
  showColumnCustomizer,
  setShowColumnCustomizer,
  showModal,
  setShowModal,
  selectedContacts,
  setSelectedContacts,
  refreshTrigger
}: ContactTableProps) => {
  const { toast } = useToast();
  const { logDelete } = useCRUDAudit();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingContact, setEditingContact] = useState<any>(null);
  const [columns, setColumns] = useState<ContactColumnConfig[]>(defaultColumns);

  // Load column configuration from localStorage on component mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('contactColumns');
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns);
        setColumns(parsedColumns);
      } catch (error) {
        console.error('Error parsing saved columns:', error);
        setColumns(defaultColumns);
      }
    }
  }, []);

  const { data: contacts = [], refetch, isLoading } = useQuery({
    queryKey: ['contacts', refreshTrigger],
    queryFn: async () => {
      console.log('ContactTable: Fetching contacts with refreshTrigger:', refreshTrigger);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });
      
      if (error) {
        console.error('ContactTable: Error fetching contacts:', error);
        throw error;
      }
      
      console.log('ContactTable: Fetched contacts:', data?.length, 'records');
      return data || [];
    },
  });

  const filteredContacts = contacts.filter(contact =>
    Object.values(contact).some(value =>
      value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleDelete = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      await logDelete('contacts', contactId, { contact_id: contactId });
      
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error", 
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingContact(null);
  };

  const handleContactSaved = () => {
    refetch();
    handleModalClose();
  };

  const toggleContactSelection = (contactId: string) => {
    const updatedSelection = selectedContacts.includes(contactId)
      ? selectedContacts.filter(id => id !== contactId)
      : [...selectedContacts, contactId];
    setSelectedContacts(updatedSelection);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const isAllSelected = selectedContacts.length === filteredContacts.length && filteredContacts.length > 0;

  const handleColumnsChange = (newColumns: ContactColumnConfig[]) => {
    setColumns(newColumns);
    localStorage.setItem('contactColumns', JSON.stringify(newColumns));
  };

  const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);

  const renderCellValue = (contact: any, field: string) => {
    const value = contact[field];
    
    if (!value) return '-';
    
    switch (field) {
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        );
      case 'phone_no':
        return (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        );
      case 'contact_source':
        return (
          <Badge variant="outline" className="capitalize">
            {value}
          </Badge>
        );
      case 'industry':
        return (
          <Badge variant="secondary" className="capitalize">
            {value}
          </Badge>
        );
      default:
        return value;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading contacts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    {visibleColumns.map(column => (
                      <TableHead key={column.field}>{column.label}</TableHead>
                    ))}
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map(contact => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => toggleContactSelection(contact.id)}
                          aria-label={`Select ${contact.contact_name}`}
                        />
                      </TableCell>
                      {visibleColumns.map(column => (
                        <TableCell key={`${contact.id}-${column.field}`}>
                          {renderCellValue(contact, column.field)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(contact)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(contact.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredContacts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                        No contacts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <ContactModal
        open={showModal}
        onOpenChange={handleModalClose}
        contact={editingContact}
        onSuccess={handleContactSaved}
      />

      <ContactColumnCustomizer
        open={showColumnCustomizer}
        onOpenChange={setShowColumnCustomizer}
        columns={columns}
        onColumnsChange={handleColumnsChange}
      />
    </>
  );
};

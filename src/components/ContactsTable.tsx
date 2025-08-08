
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Search, Edit, Trash2, Phone, Mail, Calendar, MapPin, Building, User, MoreVertical, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { ContactColumn } from "@/types/columns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  city: string;
  country: string;
  lastContacted: string;
  status: 'active' | 'inactive' | 'pending';
}

const sampleContacts: Contact[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    company: "Acme Corp",
    title: "CEO",
    city: "New York",
    country: "USA",
    lastContacted: "2023-01-01",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "987-654-3210",
    company: "Beta Inc",
    title: "CTO",
    city: "San Francisco",
    country: "USA",
    lastContacted: "2023-02-15",
    status: "inactive",
  },
  {
    id: "3",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone: "555-123-4567",
    company: "Gamma Ltd",
    title: "Marketing Manager",
    city: "London",
    country: "UK",
    lastContacted: "2023-03-20",
    status: "pending",
  },
  {
    id: "4",
    name: "Bob Williams",
    email: "bob.williams@example.com",
    phone: "111-222-3333",
    company: "Delta Co",
    title: "Sales Director",
    city: "Sydney",
    country: "Australia",
    lastContacted: "2023-04-01",
    status: "active",
  },
  {
    id: "5",
    name: "Emily Brown",
    email: "emily.brown@example.com",
    phone: "444-555-6666",
    company: "Epsilon Group",
    title: "Project Manager",
    city: "Toronto",
    country: "Canada",
    lastContacted: "2023-05-05",
    status: "inactive",
  },
];

interface ContactsTableProps {
  columns: ContactColumn[];
  contacts: Contact[];
  onEditContact: (id: string) => void;
  onDeleteContact: (id: string) => void;
}

const ContactsTable = ({ columns, contacts, onEditContact, onDeleteContact }: ContactsTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const filteredContacts = contacts.filter(contact =>
    Object.values(contact).some(value =>
      typeof value === 'string' && value.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleContactSelection = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(contactId => contactId !== id) : [...prev, id]
    );
  };

  const isAllSelected = filteredContacts.length > 0 && selectedContacts.length === filteredContacts.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleDeleteSelected = () => {
    selectedContacts.forEach(id => onDeleteContact(id));
    setSelectedContacts([]);
  };

  const handleExportSelected = () => {
    console.log('Exporting selected contacts:', selectedContacts);
    // Add export logic here
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
  };

  const visibleColumns = columns.filter(column => column.visible);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-table-header">Contacts List</CardTitle>
        <Button className="btn-add">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 input-focus"
            />
          </div>
        </div>

        {selectedContacts.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedContacts.length}
            onDelete={handleDeleteSelected}
            onExport={handleExportSelected}
            onClearSelection={handleClearSelection}
          />
        )}

        <div className="table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                {visibleColumns.map(column => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => toggleContactSelection(contact.id)}
                    />
                  </TableCell>
                  {visibleColumns.map(column => (
                    <TableCell key={column.key}>
                      {column.key === 'status' ? (
                        <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                          {contact.status}
                        </Badge>
                      ) : column.key === 'name' ? (
                        <button 
                          className="link-primary font-medium"
                          onClick={() => onEditContact(contact.id)}
                        >
                          {contact[column.key as keyof Contact]?.toString() || ''}
                        </button>
                      ) : (
                        contact[column.key as keyof Contact]?.toString() || ''
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditContact(contact.id)}
                            className="btn-action"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit contact</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>More actions</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactsTable;

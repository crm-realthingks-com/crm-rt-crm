
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, MoreVertical, RefreshCw } from "lucide-react";
import { ContactColumnConfig } from "../ContactColumnCustomizer";
import { SortableTableHead } from "../SortableTableHead";
import { SortConfig } from "@/hooks/useSorting";

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  country?: string;
  description?: string;
  contact_owner?: string;
  created_by?: string;
  modified_by?: string;
  created_time?: string;
  modified_time?: string;
}

interface ContactTableBodyProps {
  loading: boolean;
  pageContacts: Contact[];
  visibleColumns: ContactColumnConfig[];
  selectedContacts: string[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  onRefresh: () => void;
  sortConfig: SortConfig;
  onSort: (field: string) => void;
  displayNames: Record<string, string>;
}

export const ContactTableBody = ({
  loading,
  pageContacts,
  visibleColumns,
  selectedContacts,
  setSelectedContacts,
  onEdit,
  onDelete,
  searchTerm,
  onRefresh,
  sortConfig,
  onSort,
  displayNames
}: ContactTableBodyProps) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(pageContacts.map(contact => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const isAllSelected = pageContacts.length > 0 && selectedContacts.length === pageContacts.length;

  const formatFieldValue = (contact: Contact, field: string): string => {
    if (field === 'contact_owner') {
      const ownerId = contact.contact_owner || contact.created_by;
      return ownerId ? (displayNames[ownerId] || 'Loading...') : '-';
    }
    
    const value = contact[field as keyof Contact];
    return value?.toString() || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {pageContacts.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No contacts found for "{searchTerm}"</p>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {pageContacts.length === 0 && !searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No contacts available</p>
          <Button onClick={onRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {pageContacts.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all contacts"
                  />
                </TableHead>
                {visibleColumns.map(column => (
                  <SortableTableHead
                    key={column.field}
                    field={column.field}
                    label={column.label}
                    sortConfig={sortConfig}
                    onSort={onSort}
                  />
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleSelectContact(contact.id, Boolean(checked))}
                      aria-label={`Select ${contact.contact_name}`}
                    />
                  </TableCell>
                  {visibleColumns.map(column => (
                    <TableCell key={`${contact.id}-${column.field}`}>
                      {formatFieldValue(contact, column.field)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(contact)}
                        title="Edit contact"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(contact.id)}
                        title="Delete contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="More actions">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

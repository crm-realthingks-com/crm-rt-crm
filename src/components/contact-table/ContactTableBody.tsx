
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Edit, Trash2, RefreshCw, UserPlus } from "lucide-react";
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
  description?: string;
  contact_owner?: string;
  created_by?: string;
  modified_by?: string;
}

interface ContactTableBodyProps {
  loading: boolean;
  pageContacts: Contact[];
  visibleColumns: ContactColumnConfig[];
  selectedContacts: string[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onConvertToLead: (contact: Contact) => void;
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
  onConvertToLead,
  searchTerm,
  onRefresh,
  sortConfig,
  onSort,
  displayNames
}: ContactTableBodyProps) => {
  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      if (selectedContacts.length >= 50) {
        return; // Don't allow more than 50 selections
      }
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

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

      {selectedContacts.length >= 50 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Maximum of 50 records can be selected at a time. ({selectedContacts.length}/50)
          </p>
        </div>
      )}

      {pageContacts.length > 0 && (
        <div className="overflow-x-auto">
          <RadioGroup>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
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
                      <div className="flex items-center justify-center">
                        <RadioGroupItem
                          value={contact.id}
                          id={contact.id}
                          checked={selectedContacts.includes(contact.id)}
                          onClick={() => handleSelectContact(contact.id, !selectedContacts.includes(contact.id))}
                          disabled={!selectedContacts.includes(contact.id) && selectedContacts.length >= 50}
                          className="cursor-pointer"
                        />
                      </div>
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
                          onClick={() => onConvertToLead(contact)}
                          title="Convert to Lead"
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </RadioGroup>
        </div>
      )}
    </div>
  );
};

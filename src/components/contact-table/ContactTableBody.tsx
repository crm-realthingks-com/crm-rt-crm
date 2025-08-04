import React, { useState, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  FilterFn,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowDown, ArrowUp } from "lucide-react";
import { Contact } from "@/types/contact";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContactForm } from '../ContactForm';

interface ContactTableBodyProps {
  contacts: Contact[];
  filteredContacts: Contact[];
  selectedContacts: string[];
  onContactSelect: (contactId: string, isSelected: boolean) => void;
  onContactClick: (contact: Contact) => void;
  visibleColumns: ColumnDef<Contact>[];
  onUpdateContact: (contactId: string, updates: Partial<Contact>) => Promise<void>;
  onDeleteContacts: (contactIds: string[]) => Promise<void>;
  onImportContacts: (contacts: Contact[]) => void;
}

export const ContactTableBody = ({ 
  contacts, 
  filteredContacts, 
  selectedContacts, 
  onContactSelect, 
  onContactClick,
  visibleColumns,
  onUpdateContact,
  onDeleteContacts,
  onImportContacts
}: ContactTableBodyProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const table = useReactTable({
    data: filteredContacts,
    columns: visibleColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
  });

  const handleImport = async (contactsToImport: any[]) => {
    if (!user?.id) return;

    try {
      const formattedContacts = contactsToImport.map(contact => ({
        contact_name: contact.lead_name || contact.contact_name || 'Unknown',
        company: contact.company_name || contact.company || '',
        position: contact.position || '',
        email: contact.email || '',
        phone: contact.phone_no || contact.phone || '',
        linkedin: contact.linkedin || '',
        website: contact.website || '',
        source: contact.contact_source || contact.source || 'Other',
        industry: contact.industry || 'Other',
        region: contact.region || 'North America',
        description: contact.description || '',
        contact_owner: contact.lead_owner || contact.contact_owner || '',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('contacts')
        .insert(formattedContacts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Imported ${contactsToImport.length} contacts successfully`,
      });

      onImportContacts(formattedContacts);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import contacts",
        variant: "destructive",
      });
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedContact(null);
  };

  const handleSaveContact = async (contactId: string, updates: Partial<Contact>) => {
    try {
      await onUpdateContact(contactId, updates);
      handleCloseForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter contacts..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      table.getIsAllPageRowsSelected()
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                  />
                </TableHead>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : (
                          <div
                            {...{
                              className: "flex cursor-pointer gap-1",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <ArrowUp className="h-4 w-4" />,
                              desc: <ArrowDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                    </TableHead>
                  )
                })}
                <TableHead className="text-right"></TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  <TableCell className="w-[50px]">
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => onContactSelect(row.original.id, !!value)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} onClick={() => handleContactClick(row.original)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleContactClick(row.original)}>
                          View Contact
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDeleteContacts([row.original.id])}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {contacts.length} contact(s)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <ContactForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        contact={selectedContact}
        onSave={handleSaveContact}
      />
    </>
  )
}

import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
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
  pageContacts: Contact[];
  visibleColumns: any[];
  selectedContacts: string[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<string[]>>;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  onRefresh: () => Promise<void>;
}

export const ContactTableBody = ({ 
  pageContacts, 
  visibleColumns,
  selectedContacts,
  setSelectedContacts,
  onEdit,
  onDelete,
  searchTerm,
  onRefresh
}: ContactTableBodyProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [globalFilter, setGlobalFilter] = useState(searchTerm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const table = useReactTable({
    data: pageContacts,
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
        id: crypto.randomUUID(),
        contact_name: contact.contact_name || contact.lead_name || 'Unknown',
        company: contact.company || contact.company_name || '',
        position: contact.position || '',
        email: contact.email || '',
        phone: contact.phone || contact.phone_no || '',
        linkedin: contact.linkedin || '',
        website: contact.website || '',
        source: contact.source || contact.contact_source || 'Other',
        industry: contact.industry || 'Other',
        region: contact.region === 'Other' ? 'North America' : contact.region || 'North America',
        description: contact.description || '',
        contact_owner: contact.contact_owner || contact.lead_owner || '',
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

      onRefresh();
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
      // Remove non-database fields if they exist
      const { user_id, ...dbUpdates } = updates;
      
      await supabase
        .from('contacts')
        .update(dbUpdates)
        .eq('id', contactId);
      
      handleCloseForm();
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
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
                      onCheckedChange={(value) => {
                        const contactId = row.original.id;
                        if (value) {
                          setSelectedContacts(prev => [...prev, contactId]);
                        } else {
                          setSelectedContacts(prev => prev.filter(id => id !== contactId));
                        }
                      }}
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
                        <DropdownMenuItem onClick={() => onDelete(row.original.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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

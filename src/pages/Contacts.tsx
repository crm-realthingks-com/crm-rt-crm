
import { ContactTable } from "@/components/ContactTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Upload, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CSVImportExport } from "@/utils/csvImportExport";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useAuth } from "@/hooks/useAuth";

const Contacts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [contacts, setContacts] = useState<any[]>([]);

  console.log('Contacts page: Rendering');

  // Get user display names for owner fields
  const ownerIds = contacts.map(contact => contact.contact_owner).filter(Boolean);
  const { displayNames } = useUserDisplayNames(ownerIds);

  const handleImportFile = async (file: File) => {
    console.log('handleImportFile called with file:', file);
    
    if (!user) {
      console.log('No user found, showing error');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to import contacts.",
        variant: "destructive",
      });
      return;
    }

    console.log('Contacts page: Starting CSV import with file:', file.name, 'User ID:', user.id);
    
    try {
      const result = await CSVImportExport.importContacts(file, user.id);
      
      if (result.success > 0) {
        toast({
          title: "Import Successful",
          description: `Imported ${result.success} contacts successfully. ${result.duplicates} duplicates skipped, ${result.errors} errors.`,
        });
        setRefreshTrigger(prev => prev + 1);
      } else if (result.errors > 0) {
        toast({
          title: "Import Failed",
          description: `${result.errors} errors occurred. Check the console for details.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Error",
        description: "Failed to import contacts. Please check your CSV format.",
        variant: "destructive",
      });
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImportCSV triggered, event:', event);
    const file = event.target.files?.[0];
    console.log('Selected file:', file);
    
    if (!file) {
      console.log('No file selected, returning');
      return;
    }

    await handleImportFile(file);
    event.target.value = '';
  };

  const handleExportContacts = async () => {
    try {
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) {
        console.error('Database fetch error:', error);
        throw error;
      }

      if (!contactsData || contactsData.length === 0) {
        toast({
          title: "No Data",
          description: "No contacts available to export",
          variant: "destructive",
        });
        return;
      }

      await CSVImportExport.exportContacts(contactsData, {
        includeOwnerNames: true,
        userDisplayNames: displayNames
      });

      toast({
        title: "Export Successful",
        description: `Exported ${contactsData.length} contacts successfully.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export contacts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', selectedContacts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedContacts.length} contacts deleted successfully`,
      });
      
      setSelectedContacts([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete contacts",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact database</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <Download className="w-4 h-4 mr-2" />
                Action
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  console.log('Import CSV clicked');
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];
                    if (file) {
                      console.log('File selected via dropdown:', file.name);
                      handleImportFile(file);
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportContacts}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </DropdownMenuItem>
              {selectedContacts.length > 0 && (
                <DropdownMenuItem 
                  onClick={handleBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedContacts.length})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Contact Table */}
      <ContactTable 
        showColumnCustomizer={showColumnCustomizer}
        setShowColumnCustomizer={setShowColumnCustomizer}
        showModal={showModal}
        setShowModal={setShowModal}
        onExportReady={() => {}}
        selectedContacts={selectedContacts}
        setSelectedContacts={setSelectedContacts}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default Contacts;

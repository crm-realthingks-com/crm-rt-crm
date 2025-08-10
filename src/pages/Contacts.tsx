
import { ContactTable } from "@/components/ContactTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, Download, Upload, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useAuth } from "@/hooks/useAuth";
import { parseContactsCSVFile, exportContactsToCSV, downloadCSV } from "@/utils/csvUtils";

const Contacts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [contacts, setContacts] = useState<any[]>([]);

  console.log('Contacts page: Rendering');

  // Get all unique user IDs for display names from contacts
  const userIds = contacts.map(contact => contact.contact_owner || contact.created_by).filter(Boolean);
  const { displayNames } = useUserDisplayNames(userIds);

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
      const csvData = await parseContactsCSVFile(file);
      console.log('Parsed CSV data:', csvData);

      let successCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;

      for (const row of csvData) {
        try {
          // Check for duplicates based on contact name and email
          const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .or(`contact_name.eq.${row['Contact Name']},email.eq.${row['Email']}`)
            .limit(1);

          if (existing && existing.length > 0) {
            duplicateCount++;
            continue;
          }

          // Insert contact with user as owner
          const contactData = {
            contact_name: row['Contact Name'] || '',
            company_name: row['Company Name'] || '',
            position: row['Position'] || '',
            email: row['Email'] || '',
            phone_no: row['Phone'] || '',
            linkedin: row['LinkedIn'] || '',
            website: row['Website'] || '',
            contact_source: row['Contact Source'] || '',
            industry: row['Industry'] || '',
            description: row['Description'] || '',
            created_by: user.id,
            modified_by: user.id,
            contact_owner: user.id
          };

          const { error } = await supabase
            .from('contacts')
            .insert([contactData]);

          if (error) {
            console.error('Insert error:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (rowError) {
          console.error('Row processing error:', rowError);
          errorCount++;
        }
      }

      const message = `Import completed: ${successCount} imported, ${duplicateCount} duplicates skipped, ${errorCount} errors`;
      
      if (successCount > 0) {
        toast({
          title: "Import Successful",
          description: message,
        });
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast({
          title: "Import Completed",
          description: message,
          variant: errorCount > 0 ? "destructive" : "default",
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

  const handleExportContacts = async () => {
    try {
      console.log('Starting contact export...');
      
      // Fixed: Use contact_name for ordering instead of non-existent created_at
      const { data: contactsData, error } = await supabase
        .from('contacts')
        .select('*')
        .order('contact_name', { ascending: true });

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

      console.log('Exporting contacts:', contactsData.length);
      
      // Update contacts state for display names hook
      setContacts(contactsData);
      
      // Use the display names from the hook
      const csvContent = exportContactsToCSV(contactsData, displayNames);
      const filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      const success = downloadCSV(csvContent, filename);
      
      if (success) {
        toast({
          title: "Export Successful",
          description: `Exported ${contactsData.length} contacts successfully.`,
        });
      } else {
        throw new Error('Download failed');
      }

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
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={() => setShowColumnCustomizer(true)}
            size="icon"
          >
            <Settings className="w-4 h-4" />
          </Button>
          
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

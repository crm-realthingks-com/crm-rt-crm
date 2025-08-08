
import { LeadTable } from "@/components/LeadTable";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, Plus, Trash2, Download, Upload } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useAuth } from "@/hooks/useAuth";
import { useLeadsImportExport } from "@/hooks/useLeadsImportExport";

const Leads = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [leads, setLeads] = useState<any[]>([]);

  // Get user display names for owner fields
  const ownerIds = leads.map(lead => lead.contact_owner).filter(Boolean);
  const { displayNames } = useUserDisplayNames(ownerIds);

  // Import/Export functionality
  const { exportLeads, importLeads, isImporting, isExporting } = useLeadsImportExport();

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('=== IMPORT PROCESS STARTED ===');
    console.log('File:', file.name, 'Size:', file.size);

    if (!user) {
      console.error('No authenticated user found');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to import leads.",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    try {
      console.log('Calling importLeads function...');
      const result = await importLeads(file);
      console.log('Import result received:', result);
      
      // Build detailed message
      let message = '';
      let description = '';
      
      if (result.success > 0) {
        message = `Import completed: ${result.success} leads imported successfully`;
        if (result.duplicates > 0) message += `, ${result.duplicates} duplicates skipped`;
        if (result.errors > 0) message += `, ${result.errors} errors occurred`;
        
        // Show detailed error messages if any
        if (result.messages.length > 0) {
          const errorMessages = result.messages.filter(msg => !msg.includes('Mapped'));
          if (errorMessages.length > 0) {
            description = errorMessages.slice(0, 5).join('; ');
            if (errorMessages.length > 5) {
              description += `... and ${errorMessages.length - 5} more errors`;
            }
          }
        }

        toast({
          title: "Import Successful",
          description: message + (description ? ` - ${description}` : ''),
        });
        
        // Trigger table refresh
        setRefreshTrigger(prev => prev + 1);
        
      } else if (result.errors > 0) {
        console.error('Import failed with errors:', result.messages);
        
        // Show detailed error information
        const errorSummary = result.messages.slice(0, 3).join('; ');
        const hasMoreErrors = result.messages.length > 3;
        
        toast({
          title: "Import Failed",
          description: `${result.errors} errors occurred. ${errorSummary}${hasMoreErrors ? '...' : ''}`,
          variant: "destructive",
        });
        
        // Log full error details for debugging
        console.error('Full error details:', result.errorDetails);
        
      } else if (result.duplicates > 0) {
        console.log('All records were duplicates');
        toast({
          title: "Import Completed - No Changes",
          description: "All records were duplicates. No new leads were added.",
        });
        
      } else {
        console.warn('Unexpected import result state');
        toast({
          title: "Import Completed",
          description: "No records were processed.",
        });
      }
      
      // Clear the file input
      event.target.value = '';
      
    } catch (error: any) {
      console.error('=== IMPORT ERROR CAUGHT ===');
      console.error('Error details:', error);
      
      toast({
        title: "Import Error",
        description: error.message || "Failed to import leads. Please check your CSV format and try again.",
        variant: "destructive",
      });
      
      event.target.value = '';
    }
  };

  const handleExportLeads = async () => {
    try {
      console.log('Starting export process...');
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false });

      if (error) {
        console.error('Database fetch error:', error);
        throw error;
      }

      console.log('Retrieved leads for export:', leadsData?.length || 0);

      if (!leadsData || leadsData.length === 0) {
        toast({
          title: "No Data",
          description: "No leads available to export",
          variant: "destructive",
        });
        return;
      }

      await exportLeads(leadsData, displayNames);

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export leads. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeads);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedLeads.length} leads deleted successfully`,
      });
      
      setSelectedLeads([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete leads",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Leads</h1>
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
              <Button variant="default" disabled={isImporting || isExporting}>
                {isImporting ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : isExporting ? (
                  <>
                    <Download className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Action
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <label className="flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportLeads} disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </DropdownMenuItem>
              {selectedLeads.length > 0 && (
                <DropdownMenuItem 
                  onClick={handleBulkDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedLeads.length})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Lead Table */}
      <LeadTable 
        showColumnCustomizer={showColumnCustomizer}
        setShowColumnCustomizer={setShowColumnCustomizer}
        showModal={showModal}
        setShowModal={setShowModal}
        selectedLeads={selectedLeads}
        setSelectedLeads={setSelectedLeads}
        refreshTrigger={refreshTrigger}
        onLeadsChange={setLeads}
      />
    </div>
  );
};

export default Leads;

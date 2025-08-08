
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

    console.log('=== HANDLING CSV IMPORT ===');
    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

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
      console.log('Starting import process...');
      const result = await importLeads(file);
      console.log('Import completed with result:', result);
      
      // Build summary message
      const totalProcessed = result.success + result.duplicates + result.errors;
      let title = "Import Complete";
      let description = "";
      
      if (totalProcessed > 0) {
        description = `Processed ${totalProcessed} rows: `;
        const parts = [];
        if (result.success > 0) parts.push(`${result.success} imported`);
        if (result.duplicates > 0) parts.push(`${result.duplicates} duplicates`);
        if (result.errors > 0) parts.push(`${result.errors} errors`);
        description += parts.join(', ');
      } else {
        description = "No rows were processed";
      }
      
      // Show toast based on result
      if (result.errors > 0) {
        console.error('Import errors:', result.messages);
        console.error('Error details:', result.errorDetails);
        
        let errorSummary = "";
        if (result.messages.length > 0) {
          errorSummary = result.messages
            .filter(msg => !msg.includes('Unknown column') && !msg.includes('will be ignored'))
            .slice(0, 3)
            .join('; ');
        }
        
        if (errorSummary) {
          description += `. First errors: ${errorSummary}`;
          if (result.messages.length > 3) {
            description += ' (see console for all details)';
          }
        }
        
        toast({
          title: result.success > 0 ? "Import Partially Successful" : "Import Failed",
          description,
          variant: result.success > 0 ? "default" : "destructive",
        });
      } else {
        toast({
          title,
          description,
        });
      }
      
      // Trigger table refresh if any records were imported
      if (result.success > 0) {
        console.log('Refreshing leads table...');
        setRefreshTrigger(prev => prev + 1);
      }
      
    } catch (error: any) {
      console.error('=== IMPORT EXCEPTION ===');
      console.error('Error:', error);
      
      toast({
        title: "Import Error",
        description: error.message || "Failed to import leads. Please check your CSV format and try again.",
        variant: "destructive",
      });
    } finally {
      // Clear the file input
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

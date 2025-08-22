
import LeadTable from "@/components/LeadTable";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Trash2, ChevronDown, Upload, Download } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSimpleLeadsImportExport } from "@/hooks/useSimpleLeadsImportExport";
import { useLeadDeletion } from "@/hooks/useLeadDeletion";
import { LeadDeleteConfirmDialog } from "@/components/LeadDeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Leads = () => {
  const { toast } = useToast();
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { handleImport, handleExport, isImporting } = useSimpleLeadsImportExport(() => {
    setRefreshTrigger(prev => prev + 1);
  });

  const { deleteLeads, isDeleting } = useLeadDeletion();

  const handleBulkDelete = async (deleteLinkedRecords: boolean = true) => {
    if (selectedLeads.length === 0) return;

    const result = await deleteLeads(selectedLeads, deleteLinkedRecords);
    
    if (result.success) {
      setSelectedLeads([]);
      setRefreshTrigger(prev => prev + 1);
      setShowBulkDeleteDialog(false);
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedLeads.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      handleImport(file);
    } else {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          >
            <Settings className="w-4 h-4 mr-2" />
          </Button>
          
          {selectedLeads.length > 0 && (
            <Button 
              variant="destructive"
              onClick={handleBulkDeleteClick}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedLeads.length})`}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                Actions
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleBulkDeleteClick}
                disabled={selectedLeads.length === 0 || isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : `Delete Selected (${selectedLeads.length})`}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Lead Table */}
      <LeadTable 
        showColumnCustomizer={showColumnCustomizer}
        setShowColumnCustomizer={setShowColumnCustomizer}
        showModal={showModal}
        setShowModal={setShowModal}
        selectedLeads={selectedLeads}
        setSelectedLeads={setSelectedLeads}
        key={refreshTrigger}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <LeadDeleteConfirmDialog
        open={showBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteDialog(false)}
        isMultiple={true}
        count={selectedLeads.length}
      />
    </div>
  );
};

export default Leads;

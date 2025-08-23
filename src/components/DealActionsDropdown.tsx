
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Upload, Download, Columns } from "lucide-react";
import { ImportExportBar } from "./ImportExportBar";
import { DealColumnCustomizer } from "./DealColumnCustomizer";
import { Deal } from "@/types/deal";

interface DealActionsDropdownProps {
  deals: Deal[];
  selectedDeals?: Deal[];
  onImport: (deals: any[]) => void;
  onRefresh: () => void;
  showColumns?: boolean;
  columns?: any[];
  onColumnsChange?: (columns: any[]) => void;
}

export const DealActionsDropdown = ({ 
  deals, 
  selectedDeals, 
  onImport, 
  onRefresh,
  showColumns = false,
  columns,
  onColumnsChange
}: DealActionsDropdownProps) => {
  const [columnCustomizerOpen, setColumnCustomizerOpen] = useState(false);

  const handleImport = () => {
    // This will be handled by the ImportExportBar component
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Handle file import logic here
        console.log('Import file:', file);
      }
    };
    fileInput.click();
  };

  const handleExport = () => {
    // This will be handled by the ImportExportBar component
    console.log('Export deals');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 hover-scale"
          >
            <Settings className="w-4 h-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 bg-background border shadow-lg z-50"
        >
          <DropdownMenuItem 
            onClick={handleImport}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleExport}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export
          </DropdownMenuItem>
          {showColumns && (
            <DropdownMenuItem 
              onClick={() => setColumnCustomizerOpen(true)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Columns className="w-4 h-4" />
              Customize Columns
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden ImportExportBar for functionality */}
      <div className="hidden">
        <ImportExportBar
          deals={deals}
          onImport={onImport}
          onExport={() => {}}
          selectedDeals={selectedDeals}
          onRefresh={onRefresh}
        />
      </div>

      {/* Column Customizer Modal */}
      {showColumns && columns && onColumnsChange && (
        <DealColumnCustomizer
          open={columnCustomizerOpen}
          onOpenChange={setColumnCustomizerOpen}
          columns={columns}
          onColumnsChange={onColumnsChange}
        />
      )}
    </>
  );
};


import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface LeadColumnConfig {
  field: string;
  label: string;
  visible: boolean;
  order: number;
}

interface LeadColumnCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: LeadColumnConfig[];
  onColumnsChange: (columns: LeadColumnConfig[]) => void;
}

export const LeadColumnCustomizer = ({ 
  open, 
  onOpenChange, 
  columns, 
  onColumnsChange 
}: LeadColumnCustomizerProps) => {
  const [localColumns, setLocalColumns] = useState<LeadColumnConfig[]>(columns);

  // Update local columns when props change
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleVisibilityChange = (field: string, visible: boolean) => {
    const updatedColumns = localColumns.map(col => 
      col.field === field ? { ...col, visible } : col
    );
    setLocalColumns(updatedColumns);
  };

  const handleApplyChanges = () => {
    // Ensure all changes are applied and persist to localStorage
    onColumnsChange(localColumns);
    localStorage.setItem('leadTableColumns', JSON.stringify(localColumns));
    
    // Close the modal
    onOpenChange(false);
    
    // Force a small delay to ensure state updates are processed
    setTimeout(() => {
      window.dispatchEvent(new Event('leadColumnsUpdated'));
    }, 100);
  };

  const handleReset = () => {
    const defaultColumns: LeadColumnConfig[] = [
      { field: 'lead_name', label: 'Lead Name', visible: true, order: 0 },
      { field: 'company_name', label: 'Company Name', visible: true, order: 1 },
      { field: 'position', label: 'Position', visible: true, order: 2 },
      { field: 'email', label: 'Email', visible: true, order: 3 },
      { field: 'phone_no', label: 'Phone', visible: true, order: 4 },
      { field: 'region', label: 'Region', visible: true, order: 5 },
      { field: 'contact_owner', label: 'Lead Owner', visible: true, order: 6 },
      { field: 'industry', label: 'Industry', visible: false, order: 7 },
      { field: 'lead_source', label: 'Source', visible: false, order: 8 },
      { field: 'status', label: 'Status', visible: false, order: 9 },
    ];
    setLocalColumns(defaultColumns);
  };

  const handleCancel = () => {
    // Reset to original columns if user cancels
    setLocalColumns(columns);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Customize Columns</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Tip:</strong> Check/uncheck to show/hide columns in the lead table. Click "Apply Changes" to save your preferences.
          </div>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto p-1">
            {localColumns.map((column) => (
              <div
                key={column.field}
                className="flex items-center space-x-3 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
              >
                <Checkbox
                  id={column.field}
                  checked={column.visible}
                  onCheckedChange={(checked) => 
                    handleVisibilityChange(column.field, Boolean(checked))
                  }
                />
                
                <Label
                  htmlFor={column.field}
                  className="flex-1 cursor-pointer"
                >
                  {column.label}
                </Label>

                {column.visible && (
                  <span className="text-xs text-green-600 font-medium">
                    Visible
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleApplyChanges}>
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

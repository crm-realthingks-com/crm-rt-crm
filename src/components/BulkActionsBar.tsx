
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trash2, Download, X } from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onExport: () => void;
  onClearSelection: () => void;
  itemType?: string;
}

export const BulkActionsBar = ({ 
  selectedCount, 
  onDelete, 
  onExport, 
  onClearSelection,
  itemType = "deal"
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  const itemLabel = itemType === "meeting" ? "meeting" : "deal";
  const itemsLabel = itemType === "meeting" ? "meetings" : "deals";

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-card border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 backdrop-blur-sm"
           style={{ background: 'var(--gradient-subtle)', boxShadow: 'var(--shadow-lg)' }}>
        <Badge variant="secondary" className="text-sm font-bold px-2 py-1 bg-primary text-primary-foreground">
          {selectedCount} {selectedCount !== 1 ? itemsLabel : itemLabel}
        </Badge>
        
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                className="hover-scale button-scale transition-all hover:shadow-md px-3"
              >
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export selected {itemsLabel} to CSV</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                onClick={onDelete}
                className="hover-scale button-scale transition-all hover:shadow-md px-3"
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete selected {itemsLabel}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearSelection}
                className="hover-scale button-scale transition-all p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear selection</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, Upload, Download, Columns } from "lucide-react";
import { Deal } from "@/types/deal";

interface DealActionsDropdownProps {
  deals: Deal[];
  onImport: (deals: Partial<Deal>[]) => void;
  onRefresh: () => void;
  selectedDeals?: Deal[];
  onColumnCustomize?: () => void;
  showColumns?: boolean;
}

export const DealActionsDropdown = ({ 
  deals, 
  onImport, 
  onRefresh, 
  selectedDeals = [], 
  onColumnCustomize,
  showColumns = false 
}: DealActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 h-9 px-3 hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="w-4 h-4" />
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-popover border shadow-md rounded-md p-1"
        sideOffset={4}
      >
        <DropdownMenuItem 
          className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                // Handle file import logic here
                console.log('Import file:', file);
              }
            };
            input.click();
          }}
        >
          <Upload className="w-4 h-4" />
          Import
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
          onClick={() => {
            // Handle export logic here
            console.log('Export deals:', selectedDeals.length > 0 ? selectedDeals : deals);
          }}
        >
          <Download className="w-4 h-4" />
          Export
        </DropdownMenuItem>
        
        {showColumns && onColumnCustomize && (
          <DropdownMenuItem 
            className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
            onClick={onColumnCustomize}
          >
            <Columns className="w-4 h-4" />
            Customize Columns
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

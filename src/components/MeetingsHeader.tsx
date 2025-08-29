import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, MoreVertical, Upload, Download, Trash2 } from "lucide-react";

interface MeetingsHeaderProps {
  onAddMeeting: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  selectedMeetings?: string[];
  isImporting?: boolean;
}

const MeetingsHeader = ({ 
  onAddMeeting, 
  onImport, 
  onExport, 
  onDelete, 
  selectedMeetings = [], 
  isImporting = false 
}: MeetingsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Meetings</h1>
        <p className="text-muted-foreground"></p>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={isImporting}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onImport && (
              <DropdownMenuItem onClick={onImport} disabled={isImporting}>
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </DropdownMenuItem>
            )}
            {onExport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
            )}
            {onDelete && selectedMeetings.length > 0 && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedMeetings.length})
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onAddMeeting}>
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Meeting</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default MeetingsHeader;
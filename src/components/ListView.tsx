
import { useState, useMemo } from "react";
import { Deal } from "@/types/deal";
import { ColumnConfig } from "@/components/ColumnCustomizer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BulkActionsBar } from "./BulkActionsBar";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDeleteDeals: (dealIds: string[]) => void;
  onImportDeals: (deals: Partial<Deal>[]) => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export const ListView = ({ 
  deals, 
  onDealClick, 
  onUpdateDeal, 
  onDeleteDeals,
  onImportDeals,
  columns,
  onColumnsChange 
}: ListViewProps) => {
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const { toast } = useToast();

  // Get all unique lead owner IDs for display name lookup
  const leadOwnerIds = useMemo(() => {
    const ids = deals.map(deal => deal.lead_owner).filter(Boolean) as string[];
    return [...new Set(ids)];
  }, [deals]);

  const { displayNames } = useUserDisplayNames(leadOwnerIds);

  const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);

  const handleSelectDeal = (dealId: string, checked: boolean) => {
    const newSelected = new Set(selectedDeals);
    if (checked) {
      newSelected.add(dealId);
    } else {
      newSelected.delete(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(new Set(deals.map(deal => deal.id)));
    } else {
      setSelectedDeals(new Set());
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedDeals(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedDeals.size === 0) return;
    
    onDeleteDeals(Array.from(selectedDeals));
    setSelectedDeals(new Set());
    setSelectionMode(false);
    
    toast({
      title: "Deals deleted",
      description: `Successfully deleted ${selectedDeals.size} deals`,
    });
  };

  const formatCellValue = (deal: Deal, field: string) => {
    const value = deal[field as keyof Deal];
    
    switch (field) {
      case 'lead_owner':
        return value ? (displayNames[value as string] || 'Loading...') : '';
      case 'stage':
        return (
          <Badge variant="outline" className="text-xs">
            {value as string}
          </Badge>
        );
      case 'priority':
        return value ? (
          <Badge 
            variant={Number(value) >= 4 ? 'destructive' : Number(value) >= 3 ? 'default' : 'secondary'}
            className="text-xs"
          >
            P{value}
          </Badge>
        ) : '';
      case 'total_contract_value':
        return value ? `€${Number(value).toLocaleString()}` : '';
      case 'expected_closing_date':
      case 'created_at':
      case 'modified_at':
      case 'start_date':
      case 'end_date':
      case 'rfq_received_date':
      case 'proposal_due_date':
        if (!value) return '';
        try {
          return format(new Date(value as string), 'MMM dd, yyyy');
        } catch {
          return 'Invalid date';
        }
      case 'is_recurring':
        return value ? 'Yes' : 'No';
      default:
        return value || '';
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Selection Controls */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
            >
              {selectionMode ? "Exit Selection" : "Select Deals"}
            </Button>
            
            {selectionMode && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedDeals.size === deals.length && deals.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select All ({selectedDeals.size} selected)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {selectionMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDeals.size === deals.length && deals.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {visibleColumns.map((column) => (
                <TableHead key={column.field} className="text-left">
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.map((deal) => (
              <TableRow 
                key={deal.id}
                className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedDeals.has(deal.id) ? 'bg-primary/10' : ''
                }`}
                onClick={() => !selectionMode && onDealClick(deal)}
              >
                {selectionMode && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedDeals.has(deal.id)}
                      onCheckedChange={(checked) => handleSelectDeal(deal.id, Boolean(checked))}
                    />
                  </TableCell>
                )}
                {visibleColumns.map((column) => (
                  <TableCell key={`${deal.id}-${column.field}`} className="text-sm">
                    {formatCellValue(deal, column.field)}
                  </TableCell>
                ))}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDealClick(deal)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteDeals([deal.id])}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={selectedDeals.size}
        onDelete={handleBulkDelete}
        onExport={() => {}}
        onClearSelection={() => setSelectedDeals(new Set())}
      />
    </div>
  );
};

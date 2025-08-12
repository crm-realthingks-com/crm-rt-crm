
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Deal, DealStage, DEAL_STAGES, STAGE_COLORS } from "@/types/deal";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { InlineEditCell } from "./InlineEditCell";
import { ColumnCustomizer, ColumnConfig } from "./ColumnCustomizer";
import { BulkActionsBar } from "./BulkActionsBar";
import { useToast } from "@/hooks/use-toast";

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => void;
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
  const { toast } = useToast();

  const formatCurrency = (amount: number | undefined, currency: string = 'EUR') => {
    if (!amount) return '-';
    const symbols = { USD: '$', EUR: '€', INR: '₹' };
    return `${symbols[currency as keyof typeof symbols] || '€'}${amount.toLocaleString()}`;
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeals(new Set(deals.map(deal => deal.id)));
    } else {
      setSelectedDeals(new Set());
    }
  };

  const handleSelectDeal = (dealId: string, checked: boolean) => {
    const newSelected = new Set(selectedDeals);
    if (checked) {
      newSelected.add(dealId);
    } else {
      newSelected.delete(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedDeals.size === 0) return;
    
    onDeleteDeals(Array.from(selectedDeals));
    setSelectedDeals(new Set());
    
    toast({
      title: "Deals deleted",
      description: `Successfully deleted ${selectedDeals.size} deals`,
    });
  };

  const handleBulkExport = () => {
    const selectedDealObjects = deals.filter(deal => selectedDeals.has(deal.id));
    // Export logic handled by ImportExportBar
  };

  const handleInlineEdit = async (dealId: string, field: string, value: any) => {
    try {
      await onUpdateDeal(dealId, { [field]: value });
      toast({
        title: "Deal updated",
        description: "Field updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update deal field",
        variant: "destructive",
      });
    }
  };

  const getFieldType = (field: string): 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean' | 'stage' | 'priority' | 'currency' => {
    if (field === 'stage') return 'stage';
    if (field === 'priority') return 'priority';
    if (['total_contract_value', 'total_revenue', 'quarterly_revenue_q1', 'quarterly_revenue_q2', 'quarterly_revenue_q3', 'quarterly_revenue_q4'].includes(field)) return 'currency';
    if (['expected_closing_date', 'start_date', 'end_date', 'rfq_received_date', 'proposal_due_date', 'signed_contract_date', 'implementation_start_date'].includes(field)) return 'date';
    if (['internal_comment', 'customer_need', 'action_items', 'won_reason', 'lost_reason', 'need_improvement', 'drop_reason'].includes(field)) return 'textarea';
    if (['is_recurring'].includes(field)) return 'boolean';
    if (['customer_challenges', 'relationship_strength', 'business_value', 'decision_maker_level', 'rfq_status', 'handoff_status'].includes(field)) return 'select';
    if (['probability', 'project_duration'].includes(field)) return 'number';
    return 'text';
  };

  const getFieldOptions = (field: string): string[] => {
    const optionsMap: Record<string, string[]> = {
      customer_challenges: ['Open', 'Ongoing', 'Done'],
      relationship_strength: ['Low', 'Medium', 'High'],
      business_value: ['Open', 'Ongoing', 'Done'],
      decision_maker_level: ['Open', 'Ongoing', 'Done'],
      is_recurring: ['Yes', 'No', 'Unclear'],
      rfq_status: ['Drafted', 'Submitted', 'Rejected', 'Accepted'],
      handoff_status: ['Not Started', 'In Progress', 'Complete'],
      currency_type: ['EUR', 'USD', 'INR'],
    };
    return optionsMap[field] || [];
  };

  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="w-full p-4 space-y-3">
      {/* Table */}
      <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-muted/30">
                <TableHead className="w-10 p-2">
                  <Checkbox
                    checked={selectedDeals.size === deals.length && deals.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="transition-all hover:scale-105"
                  />
                </TableHead>
                {visibleColumns.map(column => (
                  <TableHead 
                    key={column.field} 
                    className="font-semibold p-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      {column.label}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-16 p-2 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center py-6 text-muted-foreground text-sm">
                    No deals found
                  </TableCell>
                </TableRow>
              ) : (
                deals.map((deal) => (
                  <TableRow 
                    key={deal.id} 
                    className={`border-b border-border/30 hover:bg-muted/20 transition-colors duration-150 ${
                      selectedDeals.has(deal.id) ? 'bg-muted/40' : ''
                    }`}
                  >
                    <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedDeals.has(deal.id)}
                        onCheckedChange={(checked) => handleSelectDeal(deal.id, Boolean(checked))}
                        className="transition-all hover:scale-105"
                      />
                    </TableCell>
                    {visibleColumns.map(column => (
                      <TableCell key={column.field} className="p-2 text-sm">
                        <InlineEditCell
                          value={deal[column.field as keyof Deal]}
                          field={column.field}
                          dealId={deal.id}
                          onSave={handleInlineEdit}
                          type={getFieldType(column.field)}
                          options={getFieldOptions(column.field)}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="p-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDealClick(deal)}
                          className="p-1 h-6 w-6 hover:bg-muted/60"
                          title="Edit deal"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onDeleteDeals([deal.id]);
                            toast({
                              title: "Deal deleted",
                              description: `Successfully deleted ${deal.project_name || 'deal'}`,
                            });
                          }}
                          className="p-1 h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete deal"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedDeals.size}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedDeals(new Set())}
      />
    </div>
  );
};

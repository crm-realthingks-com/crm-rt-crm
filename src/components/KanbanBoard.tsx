import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Deal, DealStage, DEAL_STAGES, STAGE_COLORS } from "@/types/deal";
import { useToast } from "@/hooks/use-toast";
import { useImportExport } from "@/hooks/useImportExport";

interface KanbanBoardProps {
  deals: Deal[];
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  onDealClick: (deal: Deal) => void;
  onCreateDeal: (stage: DealStage) => void;
  onDeleteDeals: (dealIds: string[]) => Promise<void>;
  onImportDeals: (deals: Partial<Deal>[]) => Promise<void>;
  onRefresh: () => void;
}

export const KanbanBoard = ({ 
  deals, 
  onUpdateDeal, 
  onDealClick, 
  onCreateDeal,
  onDeleteDeals,
  onImportDeals,
  onRefresh
}: KanbanBoardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { handleImport, handleExport } = useImportExport({
    tableName: 'deals',
    existingData: deals,
    onImport: async (importedDeals) => {
      await onImportDeals(importedDeals);
      onRefresh();
    },
    onExport: () => {}
  });

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStage = destination.droppableId as DealStage;
    await onUpdateDeal(draggableId, { stage: newStage });
  };

  const handleDeleteSelected = async () => {
    if (selectedDeals.length === 0) {
      toast({
        title: "No deals selected",
        description: "Please select deals to delete.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onDeleteDeals(selectedDeals);
      setSelectedDeals([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete deals",
        variant: "destructive",
      });
    }
  };

  const filteredDeals = deals.filter(deal => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      deal.deal_name?.toLowerCase().includes(term) ||
      deal.project_name?.toLowerCase().includes(term) ||
      deal.customer_name?.toLowerCase().includes(term) ||
      deal.lead_name?.toLowerCase().includes(term) ||
      String(deal.priority || '').toLowerCase().includes(term) ||
      deal.stage?.toLowerCase().includes(term)
    );
  });

  const dealsByStage = DEAL_STAGES.map(stage => ({
    stage,
    deals: filteredDeals.filter(deal => deal.stage === stage)
  }));

  const isDealSelected = (dealId: string) => selectedDeals.includes(dealId);

  const toggleDealSelection = (dealId: string) => {
    setSelectedDeals(prev => {
      if (prev.includes(dealId)) {
        return prev.filter(id => id !== dealId);
      } else {
        return [...prev, dealId];
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Controls */}
      <div className="flex items-center justify-between p-4">
        <Input
          type="search"
          placeholder="Search deals..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <div className="flex items-center space-x-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={selectedDeals.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex h-full">
            {dealsByStage.map(({ stage, deals }) => (
              <Droppable droppableId={stage} key={stage}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`w-80 flex-shrink-0 p-4 h-full ${snapshot.isDraggingOver ? 'bg-secondary/50' : 'bg-secondary/10'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-semibold capitalize">{stage}</h2>
                      <Badge className={STAGE_COLORS[stage]}>{deals.length}</Badge>
                    </div>
                    <ScrollArea className="rounded-md border h-[calc(100vh-250px)]">
                      {deals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-card rounded-md shadow-sm p-4 mb-2 cursor-grab ${snapshot.isDragging ? 'ring-2 ring-primary' : ''}`}
                            >
                              <div className="flex items-start justify-between">
                                <h3 className="text-md font-medium" onClick={() => onDealClick(deal)}>{deal.deal_name}</h3>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onDealClick(deal)}>
                                      View Deal
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => toggleDealSelection(deal.id)}>
                                      {isDealSelected(deal.id) ? 'Unselect' : 'Select'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <p className="text-sm text-muted-foreground">{deal.customer_name}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ScrollArea>
                    <Button
                      variant="ghost"
                      className="w-full justify-start mt-2"
                      onClick={() => onCreateDeal(stage)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deal
                    </Button>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

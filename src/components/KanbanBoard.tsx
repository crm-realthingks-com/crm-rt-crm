import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Deal, DealStage, DEAL_STAGES } from "@/types/deal";
import { DealCard } from "./DealCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DealActionsDropdown } from "./DealActionsDropdown";

interface KanbanBoardProps {
  deals: Deal[];
  onUpdateDeal: (dealId: string, updates: Partial<Deal>) => void;
  onDealClick: (deal: Deal) => void;
  onCreateDeal: (stage: DealStage) => void;
  onDeleteDeals: (dealIds: string[]) => void;
  onImportDeals: (deals: Partial<Deal>[]) => void;
  onRefresh: () => void;
}

export const KanbanBoard = ({
  deals,
  onUpdateDeal,
  onDealClick,
  onCreateDeal,
  onDeleteDeals,
  onImportDeals,
  onRefresh,
}: KanbanBoardProps) => {
  const [dealsByStage, setDealsByStage] = useState<{ [key: string]: Deal[] }>({});

  useEffect(() => {
    // Group deals by stage
    const groupedDeals = deals.reduce((acc: { [key: string]: Deal[] }, deal) => {
      if (!acc[deal.stage]) {
        acc[deal.stage] = [];
      }
      acc[deal.stage].push(deal);
      return acc;
    }, {});
    setDealsByStage(groupedDeals);
  }, [deals]);

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const dealId = draggableId;
    const newStage = destination.droppableId as DealStage;

    try {
      await onUpdateDeal(dealId, { stage: newStage });
    } catch (error) {
      console.error("Failed to update deal stage:", error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Action dropdown */}
      <div className="flex-shrink-0 p-4 bg-background border-b">
        <div className="flex items-center justify-end">
          <DealActionsDropdown
            deals={deals}
            onImport={onImportDeals}
            onRefresh={onRefresh}
            showColumns={false}
          />
        </div>
      </div>

      {/* Kanban Board Content */}
      <div className="flex-1 p-4 overflow-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 min-w-max">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = dealsByStage[stage] || [];
              return (
                <div key={stage} className="flex-shrink-0 w-80">
                  <div className="bg-card rounded-lg shadow-sm border">
                    <div className="p-4 border-b bg-muted/30">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{stage}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded-full">
                            {stageDeals.length}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCreateDeal(stage)}
                            className="hover-scale p-1 h-8 w-8"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Droppable droppableId={stage}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-4 min-h-[200px] space-y-3 transition-colors ${
                            snapshot.isDraggingOver
                              ? "bg-primary/5 border-primary/20"
                              : ""
                          }`}
                        >
                          {stageDeals.map((deal, index) => (
                            <Draggable
                              key={deal.id}
                              draggableId={deal.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`transition-all ${
                                    snapshot.isDragging
                                      ? "rotate-2 shadow-lg scale-105"
                                      : ""
                                  }`}
                                >
                                  <DealCard
                                    deal={deal}
                                    onClick={() => onDealClick(deal)}
                                    onDelete={() => onDeleteDeals([deal.id])}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

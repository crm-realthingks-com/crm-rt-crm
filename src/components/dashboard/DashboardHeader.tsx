
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

interface DashboardHeaderProps {
  activeView: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
  onCreateDeal: () => void;
  onSignOut: () => Promise<void>;
}

export const DashboardHeader = ({ 
  activeView, 
  onViewChange, 
  onCreateDeal, 
  onSignOut 
}: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-6 border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Deals Dashboard</h1>
        <Button onClick={onCreateDeal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Deal
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <Button
            variant={activeView === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('kanban')}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="w-4 h-4" />
            Kanban
          </Button>
          <Button
            variant={activeView === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('list')}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
        <NotificationBell />
        <Button variant="outline" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
};

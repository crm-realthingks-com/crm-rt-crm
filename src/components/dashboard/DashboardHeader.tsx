
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationBell";

export const DashboardHeader = () => {
  const { user } = useAuth();

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {getUserDisplayName()}
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your sales today
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <NotificationBell />
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Deal
        </Button>
        <Button variant="outline">
          <CalendarDays className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>
    </div>
  );
};

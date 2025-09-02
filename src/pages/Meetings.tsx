
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { MeetingForm } from "@/components/MeetingForm";
import { MeetingsTable } from "@/components/MeetingsTable";
import { useMeetingsImportExport } from "@/hooks/useMeetingsImportExport";
import MeetingsHeader from "@/components/MeetingsHeader";

const Meetings = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState("Upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setEditingMeeting(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (meeting: any) => {
    setEditingMeeting(meeting);
    setShowCreateForm(true);
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingMeeting(null);
  };

  const { exportMeetings, isProcessing } = useMeetingsImportExport();

  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleImport = () => {
    // TODO: Add import functionality with file picker
    console.log('Import functionality - file picker to be implemented');
  };

  const handleExport = async () => {
    await exportMeetings();
  };

  const handleBulkDelete = () => {
    // TODO: Add bulk delete functionality
    console.log('Bulk delete functionality coming soon');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <MeetingsHeader 
        onAddMeeting={() => setShowCreateForm(true)} 
        onImport={handleImport} 
        onExport={handleExport} 
        onDelete={handleBulkDelete} 
      />

      {/* Search and Filter Section - Match Leads module layout */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="All">All Meetings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <MeetingsTable 
        onEdit={handleEdit} 
        refreshTrigger={refreshTrigger} 
        statusFilter={statusFilter}
        searchQuery={searchQuery}
      />

      {/* Meeting Form Modal */}
      <MeetingForm 
        open={showCreateForm}
        onOpenChange={(open) => {
          setShowCreateForm(open);
          if (!open) {
            setEditingMeeting(null);
          }
        }}
        onSuccess={handleCreateSuccess}
        editingMeeting={editingMeeting}
      />
    </div>
  );
};

export default Meetings;

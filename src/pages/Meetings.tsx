import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MeetingForm } from "@/components/MeetingForm";
import { MeetingsTable } from "@/components/MeetingsTable";
import { MeetingsImportExport } from "@/components/MeetingsImportExport";
import MeetingsHeader from "@/components/MeetingsHeader";
const Meetings = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState("Upcoming");
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
  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleImport = () => {
    // TODO: Add import functionality
    console.log('Import functionality coming soon');
  };

  const handleExport = () => {
    // TODO: Add export functionality
    console.log('Export functionality coming soon');
  };

  const handleBulkDelete = () => {
    // TODO: Add bulk delete functionality
    console.log('Bulk delete functionality coming soon');
  };
  return <div className="p-6 space-y-6">
      {/* Header */}
      <MeetingsHeader 
        onAddMeeting={() => setShowCreateForm(true)} 
        onImport={handleImport} 
        onExport={handleExport} 
        onDelete={handleBulkDelete} 
      />

      {/* Filter Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="All">All Meetings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <MeetingsTable 
        onEdit={handleEdit} 
        refreshTrigger={refreshTrigger} 
        statusFilter={statusFilter}
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
    </div>;
};
export default Meetings;
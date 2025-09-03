
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { MeetingForm } from "@/components/MeetingForm";
import { MeetingsTable } from "@/components/MeetingsTable";
import { useMeetingsImportExport } from "@/hooks/useMeetingsImportExport";
import MeetingsHeader from "@/components/MeetingsHeader";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const Meetings = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState("Upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const { exportMeetings, importMeetings, isProcessing } = useMeetingsImportExport();
  const { toast } = useToast();

  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }

      try {
        const text = await file.text();
        await importMeetings(text);
        handleImportComplete();
      } catch (error) {
        // Error handling is done in the hook
      }
    }
    // Reset the input so the same file can be selected again
    e.target.value = '';
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

      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
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

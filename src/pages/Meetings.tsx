
import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingForm } from "@/components/MeetingForm";
import { MeetingsTable } from "@/components/MeetingsTable";
import { MeetingsImportExport } from "@/components/MeetingsImportExport";

const Meetings = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <MeetingForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCancel}
          editingMeeting={editingMeeting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Schedule and manage meetings with Microsoft Teams integration
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Meeting
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="meetings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meetings">All Meetings</TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Import/Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="space-y-4">
          <MeetingsTable 
            onEdit={handleEdit}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="import-export" className="space-y-4">
          <MeetingsImportExport onImportComplete={handleImportComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Meetings;

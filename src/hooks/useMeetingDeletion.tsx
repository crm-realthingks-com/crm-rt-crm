
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCRUDAudit } from '@/hooks/useCRUDAudit';

export const useMeetingDeletion = () => {
  const { toast } = useToast();
  const { logBulkDelete } = useCRUDAudit();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteSingleMeeting = async (meetingId: string) => {
    return deleteMeetings([meetingId]);
  };

  const deleteMeetings = async (meetingIds: string[]) => {
    if (meetingIds.length === 0) return { success: false, message: 'No meetings selected' };

    setIsDeleting(true);
    
    try {
      console.log('Starting delete process for meetings:', meetingIds);
      
      // Get meeting details for Teams cancellation
      const { data: meetingsToDelete, error: fetchError } = await supabase
        .from('meetings')
        .select('id, title, microsoft_event_id, teams_meeting_id')
        .in('id', meetingIds);

      if (fetchError) {
        console.error('Error fetching meetings for deletion:', fetchError);
        throw fetchError;
      }

      // Cancel Teams events if they exist
      for (const meeting of meetingsToDelete || []) {
        const teamsEventId = meeting.microsoft_event_id || meeting.teams_meeting_id;
        if (teamsEventId) {
          console.log('Cancelling Teams event for meeting:', meeting.id);
          try {
            await supabase.functions.invoke('create-teams-meeting', {
              body: {
                operation: 'delete',
                teamsEventId: teamsEventId
              }
            });
          } catch (teamsError) {
            console.error('Failed to cancel Teams event:', teamsError);
            // Continue with database deletion even if Teams cancellation fails
          }
        }
      }

      // Delete the meetings from database
      console.log('Deleting meetings from database...');
      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .in('id', meetingIds);

      if (deleteError) {
        console.error('Error deleting meetings:', deleteError);
        throw deleteError;
      }

      // Log the successful deletion
      await logBulkDelete('meetings', meetingIds.length, meetingIds);

      console.log('Delete operation completed successfully');
      
      const successMessage = meetingIds.length === 1 
        ? 'Meeting deleted successfully'
        : `${meetingIds.length} meetings deleted successfully`;
      
      toast({
        title: "Success",
        description: successMessage,
      });
      
      return { success: true, message: successMessage };
    } catch (error: any) {
      console.error('Delete operation failed:', error);
      
      let errorMessage = "Failed to delete meetings";
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, message: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteMeetings,
    deleteSingleMeeting,
    isDeleting
  };
};

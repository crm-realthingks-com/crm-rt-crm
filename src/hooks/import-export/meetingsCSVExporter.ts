import { GenericCSVExporter } from './genericCSVExporter';
import { supabase } from '@/integrations/supabase/client';

// Exact field order as specified for meetings, aligned with database fields
const MEETINGS_EXPORT_FIELDS = [
  'id', 'title', 'participants', 'organizer', 'status', 'teams_meeting_link', 
  'teams_meeting_id', 'description', 'created_at', 'updated_at', 'created_by', 
  'modified_by', 'duration', 'start_time_utc', 'end_time_utc', 'time_zone', 
  'microsoft_event_id', 'time_zone_display', 'meeting_action_items'
];

export class MeetingsCSVExporter {
  private genericExporter: GenericCSVExporter;

  constructor() {
    this.genericExporter = new GenericCSVExporter();
  }
  
  async exportToCSV(meetings: any[], filename: string) {
    console.log('MeetingsCSVExporter: Starting export with standardized date format');
    
    if (!meetings || meetings.length === 0) {
      throw new Error('No meetings to export');
    }

    // Fetch action items for all meetings
    const meetingIds = meetings.map(meeting => meeting.id);
    const { data: actionItems, error: actionItemsError } = await supabase
      .from('meeting_action_items')
      .select('*')
      .in('meeting_id', meetingIds)
      .order('created_at', { ascending: false });

    if (actionItemsError) {
      console.error('Error fetching action items:', actionItemsError);
      // Continue with export without action items
    }

    // Group action items by meeting_id
    const actionItemsByMeeting = (actionItems || []).reduce((acc, item) => {
      if (!acc[item.meeting_id]) {
        acc[item.meeting_id] = [];
      }
      acc[item.meeting_id].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Combine meetings with their action items and ensure proper field mapping
    const meetingsWithActionItems = meetings.map(meeting => ({
      ...meeting,
      // Convert participants array to string for CSV
      participants: Array.isArray(meeting.participants) ? meeting.participants.join(', ') : meeting.participants || '',
      meeting_action_items: JSON.stringify(actionItemsByMeeting[meeting.id] || [])
    }));

    await this.genericExporter.exportToCSV(meetingsWithActionItems, filename, MEETINGS_EXPORT_FIELDS);
    console.log('MeetingsCSVExporter: Export completed successfully');
  }
}
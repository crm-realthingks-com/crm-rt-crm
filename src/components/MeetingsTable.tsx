
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CalendarIcon, Clock, Users, ExternalLink, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Meeting {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  duration: number;
  participants: string[];
  organizer: string;
  status: string; // Changed from union type to string to match database
  teams_meeting_link?: string;
  teams_meeting_id?: string;
  description?: string;
  created_at: string;
}

interface MeetingsTableProps {
  onEdit: (meeting: Meeting) => void;
  refreshTrigger: number;
}

export const MeetingsTable = ({ onEdit, refreshTrigger }: MeetingsTableProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [refreshTrigger]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'Scheduled': 'default',
      'Completed': 'secondary',
      'Cancelled': 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'HH:mm'),
    };
  };

  const handleStatusUpdate = async (meetingId: string, newStatus: 'Completed' | 'Cancelled') => {
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      
      // If cancelling and has Teams event, cancel it first
      if (newStatus === 'Cancelled' && meeting?.teams_meeting_id) {
        console.log('Cancelling Teams event for meeting:', meetingId);
        
        const { error: teamsError } = await supabase.functions.invoke('create-teams-meeting', {
          body: {
            teamsEventId: meeting.teams_meeting_id,
          },
        });

        if (teamsError) {
          console.error('Failed to cancel Teams event:', teamsError);
          toast({
            title: "Warning",
            description: "Meeting updated locally but Teams event may not be cancelled",
            variant: "destructive",
          });
        }
      }

      // Update the meeting status in database
      const { error } = await supabase
        .from('meetings')
        .update({ 
          status: newStatus,
          modified_by: user?.id 
        })
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Meeting Updated",
        description: `Meeting has been marked as ${newStatus.toLowerCase()}`,
      });

      fetchMeetings();
    } catch (error: any) {
      console.error('Error updating meeting status:', error);
      toast({
        title: "Error",
        description: "Failed to update meeting status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      const meeting = meetings.find(m => m.id === meetingId);
      
      // Cancel Teams event if exists
      if (meeting?.teams_meeting_id) {
        console.log('Deleting Teams event for meeting:', meetingId);
        
        const { error: teamsError } = await supabase.functions.invoke('create-teams-meeting', {
          body: {
            teamsEventId: meeting.teams_meeting_id,
          },
        });

        if (teamsError) {
          console.error('Failed to delete Teams event:', teamsError);
        }
      }

      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;

      toast({
        title: "Meeting Deleted",
        description: "Meeting has been deleted successfully",
      });

      fetchMeetings();
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading meetings...</div>
        </CardContent>
      </Card>
    );
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meetings</CardTitle>
          <CardDescription>Your scheduled meetings and appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No meetings scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first meeting
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meetings</CardTitle>
        <CardDescription>
          Manage your scheduled meetings with Teams integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Teams Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((meeting) => {
                const startFormatted = formatDateTime(meeting.start_datetime);
                const endFormatted = formatDateTime(meeting.end_datetime);
                
                return (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.title}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {startFormatted.date}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {startFormatted.time} - {endFormatted.time}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                    <TableCell>
                      {meeting.teams_meeting_link ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(meeting.teams_meeting_link, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Join
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not available</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEdit(meeting)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {meeting.status === 'Scheduled' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(meeting.id, 'Completed')}
                              >
                                Mark as Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(meeting.id, 'Cancelled')}
                              >
                                Cancel Meeting
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(meeting.id)}
                            className="flex items-center gap-2 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

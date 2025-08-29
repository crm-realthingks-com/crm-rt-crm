import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, Clock, Users, ExternalLink, Edit, Trash2, CheckCircle, XCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { BulkActionsBar } from '@/components/BulkActionsBar';
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
  statusFilter?: string;
}
export const MeetingsTable = ({
  onEdit,
  refreshTrigger,
  statusFilter = 'All'
}: MeetingsTableProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('start_datetime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const fetchMeetings = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('meetings').select('*').order('start_datetime', {
        ascending: true
      });
      if (error) throw error;
      setMeetings(data || []);
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMeetings();
  }, [refreshTrigger]);

  // Filter and search logic
  const filterMeetingsByStatus = (meetings: Meeting[]) => {
    if (statusFilter === 'All') return meetings;
    if (statusFilter === 'Upcoming') {
      return meetings.filter(meeting => meeting.status === 'Scheduled' && new Date(meeting.start_datetime) > new Date());
    }
    if (statusFilter === 'Done') {
      return meetings.filter(meeting => meeting.status === 'Completed');
    }
    if (statusFilter === 'Cancelled') {
      return meetings.filter(meeting => meeting.status === 'Cancelled');
    }
    return meetings;
  };
  const filteredMeetings = filterMeetingsByStatus(meetings).filter(meeting => Object.values(meeting).some(value => String(value).toLowerCase().includes(searchQuery.toLowerCase())));

  // Selection handlers
  const toggleMeetingSelection = (meetingId: string) => {
    setSelectedMeetings(prev => {
      if (prev.includes(meetingId)) {
        return prev.filter(id => id !== meetingId);
      } else {
        return [...prev, meetingId];
      }
    });
  };
  const toggleSelectAllMeetings = () => {
    if (selectedMeetings.length === filteredMeetings.length) {
      setSelectedMeetings([]);
    } else {
      setSelectedMeetings(filteredMeetings.map(meeting => meeting.id));
    }
  };
  const isAllSelected = selectedMeetings.length === filteredMeetings.length && filteredMeetings.length > 0;
  const handleDeleteSelected = () => {
    selectedMeetings.forEach(meetingId => handleDelete(meetingId));
    setSelectedMeetings([]);
  };
  const handleClearSelection = () => {
    setSelectedMeetings([]);
  };
  const handleExportSelected = () => {
    const selectedData = meetings.filter(meeting => selectedMeetings.includes(meeting.id));
    console.log('Exporting selected meetings:', selectedData);
    // Export logic would go here
  };
  const getStatusBadge = (status: string) => {
    const variants = {
      'Scheduled': 'default',
      'Completed': 'secondary',
      'Cancelled': 'destructive'
    } as const;
    const colors = {
      'Scheduled': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'Completed': 'bg-green-100 text-green-800 hover:bg-green-200',
      'Cancelled': 'bg-red-100 text-red-800 hover:bg-red-200'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'default'} className={colors[status as keyof typeof colors] || ''}>
        {status}
      </Badge>;
  };
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'HH:mm')
    };
  };
  const handleStatusUpdate = async (meetingId: string, newStatus: 'Completed' | 'Cancelled') => {
    try {
      const meeting = meetings.find(m => m.id === meetingId);

      // If cancelling and has Teams event, cancel it first
      if (newStatus === 'Cancelled' && meeting?.teams_meeting_id) {
        console.log('Cancelling Teams event for meeting:', meetingId);
        const {
          error: teamsError
        } = await supabase.functions.invoke('create-teams-meeting', {
          body: {
            teamsEventId: meeting.teams_meeting_id
          }
        });
        if (teamsError) {
          console.error('Failed to cancel Teams event:', teamsError);
          toast({
            title: "Warning",
            description: "Meeting updated locally but Teams event may not be cancelled",
            variant: "destructive"
          });
        }
      }

      // Update the meeting status in database
      const {
        error
      } = await supabase.from('meetings').update({
        status: newStatus,
        modified_by: user?.id
      }).eq('id', meetingId);
      if (error) throw error;
      toast({
        title: "Meeting Updated",
        description: `Meeting has been marked as ${newStatus.toLowerCase()}`
      });
      fetchMeetings();
    } catch (error: any) {
      console.error('Error updating meeting status:', error);
      toast({
        title: "Error",
        description: "Failed to update meeting status",
        variant: "destructive"
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
        const {
          error: teamsError
        } = await supabase.functions.invoke('create-teams-meeting', {
          body: {
            teamsEventId: meeting.teams_meeting_id
          }
        });
        if (teamsError) {
          console.error('Failed to delete Teams event:', teamsError);
        }
      }
      const {
        error
      } = await supabase.from('meetings').delete().eq('id', meetingId);
      if (error) throw error;
      toast({
        title: "Meeting Deleted",
        description: "Meeting has been deleted successfully"
      });
      fetchMeetings();
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading meetings...</div>
        </CardContent>
      </Card>;
  }
  if (meetings.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>Meetings</CardTitle>
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
      </Card>;
  }
  return <Card>
      
      <CardContent>
        <div className="mb-4">
          <Input type="text" placeholder="Search meetings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        {selectedMeetings.length > 0 && <BulkActionsBar selectedCount={selectedMeetings.length} onDelete={handleDeleteSelected} onExport={handleExportSelected} onClearSelection={handleClearSelection} />}

        <div className="overflow-x-auto">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAllMeetings} aria-label="Select all" />
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => {
                  setSortField('title');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Title
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => {
                  setSortField('start_datetime');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Date
                  </TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => {
                  setSortField('participants');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Participants
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => {
                  setSortField('status');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Status
                  </TableHead>
                  <TableHead>Teams Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.map(meeting => {
                const startFormatted = formatDateTime(meeting.start_datetime);
                const endFormatted = formatDateTime(meeting.end_datetime);
                return <TableRow key={meeting.id} className="hover:bg-muted/50">
                      <TableCell className="w-[50px]">
                        <Checkbox checked={selectedMeetings.includes(meeting.id)} onCheckedChange={() => toggleMeetingSelection(meeting.id)} aria-label={`Select ${meeting.title}`} />
                      </TableCell>
                      <TableCell className="font-medium">{meeting.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          {startFormatted.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {startFormatted.time} - {endFormatted.time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {meeting.participants.length > 0 ? meeting.participants.map((participant, index) => <span key={index} className="text-sm text-muted-foreground">
                                {participant}
                              </span>) : <span className="text-sm text-muted-foreground">No participants</span>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                      <TableCell>
                        {meeting.teams_meeting_link ? <Button variant="outline" size="sm" onClick={() => window.open(meeting.teams_meeting_link, '_blank')} className="flex items-center gap-1 hover:bg-primary hover:text-primary-foreground">
                            <ExternalLink className="h-3 w-3" />
                            Join
                          </Button> : <span className="text-muted-foreground text-sm">Not available</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => onEdit(meeting)} className="h-8 w-8">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Meeting</p>
                            </TooltipContent>
                          </Tooltip>

                          {meeting.status === 'Scheduled' && <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => handleStatusUpdate(meeting.id, 'Completed')} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mark as Completed</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => handleStatusUpdate(meeting.id, 'Cancelled')} className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Cancel Meeting</p>
                                </TooltipContent>
                              </Tooltip>
                            </>}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(meeting.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Meeting</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>;
              })}
                {filteredMeetings.length === 0 && <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      {searchQuery ? 'No meetings found matching your search.' : 'No meetings found.'}
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>;
};
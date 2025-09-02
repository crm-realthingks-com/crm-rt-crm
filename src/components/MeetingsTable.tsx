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
import { MeetingDeleteConfirmDialog } from '@/components/MeetingDeleteConfirmDialog';
import { useMeetingDeletion } from '@/hooks/useMeetingDeletion';
import { getBrowserTimezone, convertUTCToLocal, formatDateTimeWithTimezone } from '@/utils/timezoneUtils';

interface Meeting {
  id: string;
  title: string;
  start_time_utc: string;
  end_time_utc: string;
  duration?: number;
  time_zone: string;
  time_zone_display?: string;
  participants: string[];
  organizer: string;
  status: string;
  teams_meeting_link?: string;
  teams_meeting_id?: string;
  microsoft_event_id?: string;
  description?: string;
  created_at: string;
}

interface MeetingsTableProps {
  onEdit: (meeting: Meeting) => void;
  refreshTrigger: number;
  statusFilter?: string;
  searchQuery?: string;
}

export const MeetingsTable = ({
  onEdit,
  refreshTrigger,
  statusFilter = 'All',
  searchQuery = ''
}: MeetingsTableProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('start_datetime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const { deleteMeetings, isDeleting } = useMeetingDeletion();

  const fetchMeetings = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('meetings').select('*').order('start_time_utc', {
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

  const filterMeetingsByStatus = (meetings: Meeting[]) => {
    if (statusFilter === 'All') return meetings;
    if (statusFilter === 'Upcoming') {
      return meetings.filter(meeting => {
        const startTime = new Date(meeting.start_time_utc);
        return meeting.status === 'Scheduled' && !isNaN(startTime.getTime()) && startTime > new Date();
      });
    }
    if (statusFilter === 'Completed') {
      return meetings.filter(meeting => meeting.status === 'Completed');
    }
    if (statusFilter === 'Cancelled') {
      return meetings.filter(meeting => meeting.status === 'Cancelled');
    }
    return meetings;
  };

  const filteredMeetings = filterMeetingsByStatus(meetings).filter(meeting => {
    const query = (searchQuery || localSearchQuery).toLowerCase();
    const searchableFields = [
      meeting.title,
      meeting.description || '',
      meeting.participants.join(' ')
    ];
    return searchableFields.some(field => field.toLowerCase().includes(query));
  });

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

  const handleDeleteSelected = async () => {
    if (selectedMeetings.length === 0) return;
    
    const result = await deleteMeetings(selectedMeetings);
    if (result.success) {
      setSelectedMeetings([]);
      fetchMeetings(); // Refresh the table
    }
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

  const formatDateTime = (meeting: Meeting) => {
    // Use new UTC fields only
    const startUTC = new Date(meeting.start_time_utc || '');
    const endUTC = new Date(meeting.end_time_utc || '');
    const timezone = meeting.time_zone || getBrowserTimezone();
    try {
      // Validate dates
      if (isNaN(startUTC.getTime()) || isNaN(endUTC.getTime())) {
        throw new Error('Invalid datetime values');
      }

      // Convert UTC to local time in the meeting's original timezone
      const {
        localDate: startLocal,
        timeString: startTime
      } = convertUTCToLocal(startUTC, timezone);
      const {
        timeString: endTime
      } = convertUTCToLocal(endUTC, timezone);
      return {
        date: format(startLocal, 'MMM dd, yyyy'),
        time: `${startTime} - ${endTime}`,
        timezone: meeting.time_zone_display || timezone.split('/').pop()?.replace('_', ' ') || 'UTC'
      };
    } catch (error) {
      console.error('Error formatting datetime for meeting:', meeting.id, error);
      // Fallback to raw UTC display
      return {
        date: 'Invalid Date',
        time: 'Invalid Time',
        timezone: 'UTC'
      };
    }
  };

  const handleStatusUpdate = async (meetingId: string, newStatus: 'Completed' | 'Cancelled') => {
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      let teamsSuccess = true;

      // If cancelling and has Teams event, cancel it first
      const teamsEventId = meeting?.microsoft_event_id || meeting?.teams_meeting_id;
      if (newStatus === 'Cancelled' && teamsEventId) {
        console.log('Cancelling Teams event for meeting:', meetingId, 'with event ID:', teamsEventId);
        try {
          const {
            data: cancelResult,
            error: cancelError
          } = await supabase.functions.invoke('create-teams-meeting', {
            body: {
              operation: 'delete',
              teamsEventId: teamsEventId
            }
          });
          
          if (cancelError) {
            console.error('Teams cancellation error:', cancelError);
            teamsSuccess = false;
            toast({
              title: "Teams Sync Warning",
              description: "Failed to cancel Teams meeting. Please cancel manually in Teams.",
              variant: "destructive"
            });
          } else if (cancelResult?.success) {
            console.log('Teams event cancelled successfully');
            toast({
              title: "Teams Meeting Cancelled",
              description: "Teams meeting has been cancelled successfully",
            });
          } else {
            console.error('Teams cancellation failed:', cancelResult);
            teamsSuccess = false;
            toast({
              title: "Teams Sync Warning", 
              description: "Teams meeting cancellation may have failed. Please check Teams.",
              variant: "destructive"
            });
          }
        } catch (teamsError) {
          console.error('Failed to cancel Teams event:', teamsError);
          teamsSuccess = false;
          toast({
            title: "Teams Sync Error",
            description: "Could not connect to Teams. Meeting will be updated locally only.",
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

      // Show appropriate success message
      if (newStatus === 'Cancelled') {
        if (teamsEventId && teamsSuccess) {
          toast({
            title: "Meeting Cancelled",
            description: "Meeting and Teams event have been cancelled successfully"
          });
        } else if (teamsEventId) {
          toast({
            title: "Meeting Cancelled Locally",
            description: "Meeting cancelled in app. Please manually cancel in Teams if needed."
          });
        } else {
          toast({
            title: "Meeting Cancelled",
            description: "Meeting has been cancelled successfully"
          });
        }
      } else {
        toast({
          title: "Meeting Updated",
          description: `Meeting has been marked as ${newStatus.toLowerCase()}`
        });
      }
      
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

  const handleDeleteClick = (meeting: Meeting) => {
    setMeetingToDelete(meeting);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!meetingToDelete) return;
    
    const result = await deleteMeetings([meetingToDelete.id]);
    if (result.success) {
      fetchMeetings(); // Refresh the table
    }
    
    setMeetingToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDelete = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting) {
      handleDeleteClick(meeting);
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
        {!searchQuery && <div className="mb-4">
            
          </div>}

        {selectedMeetings.length > 0 && <BulkActionsBar 
          selectedCount={selectedMeetings.length} 
          onDelete={handleDeleteSelected} 
          onExport={handleExportSelected} 
          onClearSelection={handleClearSelection}
          itemType="meeting"
        />}

        <div className="overflow-x-auto">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAllMeetings} aria-label="Select all" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                  setSortField('title');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Meeting Title ↕
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                  setSortField('start_datetime');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Date & Time ↕
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                  setSortField('participants');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Participants ↕
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                  setSortField('status');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Status ↕
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => {
                  setSortField('organizer');
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}>
                    Organizer ↕
                  </TableHead>
                  <TableHead>Teams Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetings.map(meeting => {
                const formatted = formatDateTime(meeting);
                return <TableRow key={meeting.id} className="hover:bg-muted/50">
                      <TableCell className="w-[50px]">
                        <Checkbox checked={selectedMeetings.includes(meeting.id)} onCheckedChange={() => toggleMeetingSelection(meeting.id)} aria-label={`Select ${meeting.title}`} />
                      </TableCell>
                      <TableCell className="font-medium">{meeting.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{formatted.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{formatted.time}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatted.timezone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col gap-1">
                            {meeting.participants.length > 0 ? meeting.participants.slice(0, 2).map((participant, index) => <span key={index} className="text-sm text-muted-foreground">
                                  {participant}
                                </span>) : <span className="text-sm text-muted-foreground">No participants</span>}
                            {meeting.participants.length > 2 && <span className="text-xs text-muted-foreground">+{meeting.participants.length - 2} more</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{meeting.organizer}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => meeting.teams_meeting_link && window.open(meeting.teams_meeting_link, '_blank')} disabled={!meeting.teams_meeting_link} className="flex items-center gap-1 hover:bg-primary hover:text-primary-foreground disabled:opacity-50">
                          <ExternalLink className="h-3 w-3" />
                          Join Meeting
                        </Button>
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
                               <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(meeting)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
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
      
      <MeetingDeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} meetingTitle={meetingToDelete?.title} />
    </Card>;
};

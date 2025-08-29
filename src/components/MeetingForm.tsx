
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Clock, Users, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startDateTime: z.string().min(1, 'Start date and time is required'),
  endDateTime: z.string().min(1, 'End date and time is required'),
  participants: z.array(z.string().email('Invalid email format')).min(1, 'At least one participant is required'),
  description: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endDateTime"],
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editingMeeting?: any;
}

export const MeetingForm = ({ onSuccess, onCancel, editingMeeting }: MeetingFormProps) => {
  const { toast } = useToast();
  const [participantInput, setParticipantInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      startDateTime: '',
      endDateTime: '',
      participants: [],
      description: '',
    },
  });

  const { watch, setValue, getValues } = form;
  const participants = watch('participants') || [];

  useEffect(() => {
    if (editingMeeting) {
      const startDate = new Date(editingMeeting.start_datetime);
      const endDate = new Date(editingMeeting.end_datetime);
      
      // Format datetime for input (YYYY-MM-DDTHH:MM)
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      form.reset({
        title: editingMeeting.title,
        startDateTime: formatDateTime(startDate),
        endDateTime: formatDateTime(endDate),
        participants: editingMeeting.participants || [],
        description: editingMeeting.description || '',
      });
    }
  }, [editingMeeting, form]);

  const addParticipant = () => {
    if (participantInput.trim() && participantInput.includes('@')) {
      const email = participantInput.trim().toLowerCase();
      const currentParticipants = getValues('participants') || [];
      if (!currentParticipants.includes(email)) {
        setValue('participants', [...currentParticipants, email]);
        setParticipantInput('');
      }
    }
  };

  const removeParticipant = (email: string) => {
    const currentParticipants = getValues('participants') || [];
    setValue('participants', currentParticipants.filter(p => p !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipant();
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const startDateTime = new Date(data.startDateTime).toISOString();
      const endDateTime = new Date(data.endDateTime).toISOString();

      // Check if meeting is in the past
      if (new Date(startDateTime) < new Date()) {
        toast({
          title: "Invalid Date",
          description: "Cannot schedule meetings in the past",
          variant: "destructive",
        });
        return;
      }

      let teamsResult;
      
      if (editingMeeting) {
        // Update existing meeting
        if (editingMeeting.teams_meeting_id) {
          // Update Teams event
          teamsResult = await supabase.functions.invoke('create-teams-meeting', {
            body: {
              title: data.title,
              startDateTime,
              endDateTime,
              participants: data.participants,
              description: data.description,
              teamsEventId: editingMeeting.teams_meeting_id,
            },
          });

          if (teamsResult.error) {
            console.error('Teams update error:', teamsResult.error);
          }
        }

        // Update in database
        const { error: updateError } = await supabase
          .from('meetings')
          .update({
            title: data.title,
            start_datetime: startDateTime,
            end_datetime: endDateTime,
            participants: data.participants,
            description: data.description,
            modified_by: user.id,
          })
          .eq('id', editingMeeting.id);

        if (updateError) throw updateError;

        toast({
          title: "Meeting Updated",
          description: "Meeting has been updated successfully",
        });
      } else {
        // Create new Teams event
        teamsResult = await supabase.functions.invoke('create-teams-meeting', {
          body: {
            title: data.title,
            startDateTime,
            endDateTime,
            participants: data.participants,
            description: data.description,
          },
        });

        let teamsEventId = null;
        let teamsLink = null;

        if (teamsResult.data && !teamsResult.error) {
          teamsEventId = teamsResult.data.eventId;
          teamsLink = teamsResult.data.joinUrl || teamsResult.data.webLink;
        } else {
          console.error('Teams creation error:', teamsResult.error);
          toast({
            title: "Teams Integration Warning",
            description: "Meeting created but Teams link may not be available",
            variant: "destructive",
          });
        }

        // Insert into database
        const { error: insertError } = await supabase
          .from('meetings')
          .insert({
            title: data.title,
            start_datetime: startDateTime,
            end_datetime: endDateTime,
            participants: data.participants,
            organizer: user.id,
            created_by: user.id,
            description: data.description,
            teams_meeting_id: teamsEventId,
            teams_meeting_link: teamsLink,
          });

        if (insertError) throw insertError;

        toast({
          title: "Meeting Created",
          description: "Meeting has been created successfully",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          {editingMeeting ? 'Edit Meeting' : 'Create New Meeting'}
        </CardTitle>
        <CardDescription>
          {editingMeeting ? 'Update meeting details' : 'Schedule a new meeting with Teams integration'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start Date & Time *
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      End Date & Time *
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="participants"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Participants *
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter email address"
                          value={participantInput}
                          onChange={(e) => setParticipantInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                        />
                        <Button type="button" onClick={addParticipant} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {participants.map((email) => (
                          <div
                            key={email}
                            className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                          >
                            {email}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeParticipant(email)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Meeting agenda or description" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingMeeting ? 'Update Meeting' : 'Create Meeting'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

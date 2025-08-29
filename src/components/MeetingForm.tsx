
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startDate: z.date({ required_error: 'Start date is required' }),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.string().min(1, 'Duration is required'),
  participants: z.array(z.string()).min(1, 'At least one participant is required'),
  description: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingMeeting?: any;
}

// Generate time slots every 30 minutes
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();
const durationOptions = [
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
];

export const MeetingForm = ({ open, onOpenChange, onSuccess, editingMeeting }: MeetingFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<any[]>([]);

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      startDate: new Date(),
      startTime: '',
      duration: '60',
      participants: [],
      description: '',
    },
  });

  const participants = form.watch('participants') || [];

  // Fetch leads with status "New" for participants dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, lead_name, email, company_name')
        .eq('lead_status', 'New')
        .not('email', 'is', null);
      
      if (!error && leads) {
        setAvailableLeads(leads);
      }
    };
    
    fetchLeads();
  }, []);

  useEffect(() => {
    if (editingMeeting) {
      const startDate = new Date(editingMeeting.start_datetime);
      const endDate = new Date(editingMeeting.end_datetime);
      
      // Calculate duration in minutes
      const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      
      form.reset({
        title: editingMeeting.title,
        startDate: startDate,
        startTime: `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`,
        duration: durationMinutes.toString(),
        participants: editingMeeting.participants || [],
        description: editingMeeting.description || '',
      });
    } else {
      // Set default time to next available slot
      const now = new Date();
      const nextSlot = Math.ceil(now.getMinutes() / 30) * 30;
      const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${nextSlot.toString().padStart(2, '0')}`;
      
      form.reset({
        title: '',
        startDate: new Date(),
        startTime: defaultTime,
        duration: '60',
        participants: [],
        description: '',
      });
    }
  }, [editingMeeting, form]);

  const handleParticipantToggle = (leadId: string) => {
    const currentParticipants = form.getValues('participants') || [];
    if (currentParticipants.includes(leadId)) {
      form.setValue('participants', currentParticipants.filter(p => p !== leadId));
    } else {
      form.setValue('participants', [...currentParticipants, leadId]);
    }
  };

  const onSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create start datetime from date and time
      const [hours, minutes] = data.startTime.split(':').map(Number);
      const startDateTime = new Date(data.startDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Calculate end datetime based on duration
      const durationMinutes = parseInt(data.duration);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

      // Check if meeting is in the past
      if (startDateTime < new Date()) {
        toast({
          title: "Invalid Date",
          description: "Cannot schedule meetings in the past",
          variant: "destructive",
        });
        return;
      }

      // Get participant emails from selected leads
      const participantEmails = data.participants.map(leadId => {
        const lead = availableLeads.find(l => l.id === leadId);
        return lead?.email || leadId;
      });

      let teamsResult;
      
      if (editingMeeting) {
        // Update existing meeting
        if (editingMeeting.teams_meeting_id) {
          // Update Teams event
          teamsResult = await supabase.functions.invoke('create-teams-meeting', {
            body: {
              title: data.title,
              startDateTime: startDateTime.toISOString(),
              endDateTime: endDateTime.toISOString(),
              participants: participantEmails,
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
            start_datetime: startDateTime.toISOString(),
            end_datetime: endDateTime.toISOString(),
            participants: participantEmails,
            description: data.description,
            duration: parseInt(data.duration),
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
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
            participants: participantEmails,
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
            start_datetime: startDateTime.toISOString(),
            end_datetime: endDateTime.toISOString(),
            participants: participantEmails,
            organizer: user.id,
            created_by: user.id,
            description: data.description,
            duration: parseInt(data.duration),
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
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {editingMeeting ? 'Edit Meeting' : 'Create New Meeting'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Start Date *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start Time *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Duration *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    Participants (Leads with Status = "New") *
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                      {availableLeads.length > 0 ? (
                        availableLeads.map((lead) => (
                          <div key={lead.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={lead.id}
                              checked={participants.includes(lead.id)}
                              onCheckedChange={() => handleParticipantToggle(lead.id)}
                            />
                            <label
                              htmlFor={lead.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {lead.lead_name} ({lead.email}) 
                              {lead.company_name && ` - ${lead.company_name}`}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No leads with status "New" found. Create some leads first.
                        </p>
                      )}
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
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingMeeting ? 'Update Meeting' : 'Create Meeting'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

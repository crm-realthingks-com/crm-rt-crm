
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Meeting {
  id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  agenda?: string;
  participants?: string[];
  tags?: string[];
  priority?: string;
  status?: string;
  follow_up_required?: boolean;
  host?: string;
  teams_link?: string;
  contact_id?: string;
  lead_id?: string;
  deal_id?: string;
  outcome?: string;
  next_action?: string;
  created_at?: string;
  updated_at?: string;
}

interface MeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: Meeting | null;
  onSuccess: () => void;
}

export const MeetingModal = ({ open, onOpenChange, meeting, onSuccess }: MeetingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Meeting>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    agenda: '',
    participants: [],
    tags: [],
    priority: 'Medium',
    status: 'Scheduled',
    follow_up_required: false,
    host: user?.email || '',
    teams_link: '',
    contact_id: '',
    lead_id: '',
    deal_id: '',
    outcome: '',
    next_action: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meeting) {
      setFormData({
        ...meeting,
        host: meeting.host || user?.email || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        agenda: '',
        participants: [],
        tags: [],
        priority: 'Medium',
        status: 'Scheduled',
        follow_up_required: false,
        host: user?.email || '',
        teams_link: '',
        contact_id: '',
        lead_id: '',
        deal_id: '',
        outcome: '',
        next_action: '',
      });
    }
  }, [meeting, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const meetingData = {
        ...formData,
        user_id: user.id,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (meeting?.id) {
        const { error } = await supabase
          .from('meetings')
          .update(meetingData)
          .eq('id', meeting.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Meeting updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('meetings')
          .insert(meetingData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Meeting created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving meeting:', error);
      toast({
        title: "Error",
        description: "Failed to save meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? 'Edit Meeting' : 'Create New Meeting'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority || 'Medium'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'Scheduled'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={formData.host || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              value={formData.agenda || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="follow_up_required"
              checked={formData.follow_up_required}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, follow_up_required: !!checked }))}
            />
            <Label htmlFor="follow_up_required">Follow-up Required</Label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : meeting ? 'Update Meeting' : 'Create Meeting'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

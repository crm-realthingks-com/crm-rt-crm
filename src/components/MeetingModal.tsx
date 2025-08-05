import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface Meeting {
  id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  agenda?: string;
  outcome?: string;
  next_action?: string;
  status?: string;
  priority?: string;
  participants?: string[];
  teams_link?: string;
  lead_id?: string;
  contact_id?: string;
  deal_id?: string;
  tags?: string[];
  follow_up_required?: boolean;
  host?: string;
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
    outcome: '',
    next_action: '',
    status: 'scheduled',
    priority: 'Medium',
    participants: [],
    teams_link: '',
    tags: [],
    follow_up_required: false,
    host: user?.email || '',
  });

  const [loading, setLoading] = useState(false);
  const [newParticipant, setNewParticipant] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (meeting) {
      setFormData({
        ...meeting,
        participants: meeting.participants || [],
        tags: meeting.tags || [],
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
        outcome: '',
        next_action: '',
        status: 'scheduled',
        priority: 'Medium',
        participants: [],
        teams_link: '',
        tags: [],
        follow_up_required: false,
        host: user?.email || '',
      });
    }
  }, [meeting, user]);

  const addParticipant = () => {
    if (newParticipant.trim() && !formData.participants?.includes(newParticipant.trim())) {
      setFormData(prev => ({
        ...prev,
        participants: [...(prev.participants || []), newParticipant.trim()]
      }));
      setNewParticipant('');
    }
  };

  const removeParticipant = (participant: string) => {
    setFormData(prev => ({
      ...prev,
      participants: (prev.participants || []).filter(p => p !== participant)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag)
    }));
  };

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
          .insert([meetingData]);

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
              <Label htmlFor="title">Title *</Label>
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'scheduled'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="teams_link">Teams Link</Label>
              <Input
                id="teams_link"
                value={formData.teams_link || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, teams_link: e.target.value }))}
              />
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

          {/* Participants */}
          <div>
            <Label>Participants</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add participant email"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipant())}
              />
              <Button type="button" onClick={addParticipant} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.participants?.map((participant, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {participant}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeParticipant(participant)} 
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeTag(tag)} 
                  />
                </Badge>
              ))}
            </div>
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

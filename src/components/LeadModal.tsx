import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: any;
  onSuccess?: () => void;
  onConvertToDeal?: (leadData: any) => void;
}

export const LeadModal = ({ open, onOpenChange, lead, onSuccess, onConvertToDeal }: LeadModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    lead_name: '',
    company_name: '',
    position: '',
    email: '',
    phone_no: '',
    linkedin: '',
    website: '',
    lead_source: '',
    industry: '',
    region: 'EU',
    description: '',
    status: 'New'
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        lead_name: lead.lead_name || '',
        company_name: lead.company_name || '',
        position: lead.position || '',
        email: lead.email || '',
        phone_no: lead.phone_no || '',
        linkedin: lead.linkedin || '',
        website: lead.website || '',
        lead_source: lead.lead_source || '',
        industry: lead.industry || '',
        region: lead.region || 'EU',
        description: lead.description || '',
        status: lead.status || 'New'
      });
    } else {
      setFormData({
        lead_name: '',
        company_name: '',
        position: '',
        email: '',
        phone_no: '',
        linkedin: '',
        website: '',
        lead_source: '',
        industry: '',
        region: 'EU',
        description: '',
        status: 'New'
      });
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const leadData = {
        ...formData,
        contact_owner: user.id,
        created_by: user.id,
        modified_by: user.id,
        created_time: new Date().toISOString(),
        modified_time: new Date().toISOString()
      };

      if (lead) {
        // Update existing lead
        const { error } = await supabase
          .from('leads')
          .update({
            ...formData,
            modified_by: user.id,
            modified_time: new Date().toISOString()
          })
          .eq('id', lead.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        // Create new lead
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving lead:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save lead",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToDeal = () => {
    if (!lead || !onConvertToDeal) return;
    
    // Pass the lead data to the parent component to open deal form
    onConvertToDeal({
      ...lead,
      ...formData // Include any unsaved changes from the form
    });
    
    // Close the lead modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_name">Lead Name *</Label>
              <Input
                id="lead_name"
                value={formData.lead_name}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_no">Phone</Label>
              <Input
                id="phone_no"
                value={formData.phone_no}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_no: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EU">EU</SelectItem>
                  <SelectItem value="NA">NA</SelectItem>
                  <SelectItem value="APAC">APAC</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_source">Lead Source</Label>
              <Input
                id="lead_source"
                value={formData.lead_source}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_source: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>

            {lead && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {lead && onConvertToDeal && (
                <Button
                  type="button"
                  onClick={handleConvertToDeal}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Convert to Deal
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

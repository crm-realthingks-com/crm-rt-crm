
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

interface Lead {
  id?: string;
  lead_name: string;
  contact_name?: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  mobile_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  lead_status?: string;
  industry?: string;
  no_of_employees?: number;
  annual_revenue?: number;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  lead_owner?: string;
  created_at?: string;
  updated_at?: string;
}

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSuccess: () => void;
}

export const LeadModal = ({ open, onOpenChange, lead, onSuccess }: LeadModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Lead>({
    lead_name: '',
    contact_name: '',
    company_name: '',
    position: '',
    email: '',
    phone_no: '',
    mobile_no: '',
    linkedin: '',
    website: '',
    contact_source: 'Other',
    lead_status: 'New',
    industry: 'Other',
    no_of_employees: undefined,
    annual_revenue: undefined,
    city: '',
    state: '',
    country: '',
    description: '',
    lead_owner: user?.email || '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        ...lead,
        lead_owner: lead.lead_owner || user?.email || '',
      });
    } else {
      setFormData({
        lead_name: '',
        contact_name: '',
        company_name: '',
        position: '',
        email: '',
        phone_no: '',
        mobile_no: '',
        linkedin: '',
        website: '',
        contact_source: 'Other',
        lead_status: 'New',
        industry: 'Other',
        no_of_employees: undefined,
        annual_revenue: undefined,
        city: '',
        state: '',
        country: '',
        description: '',
        lead_owner: user?.email || '',
      });
    }
  }, [lead, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const leadData = {
        ...formData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (lead?.id) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', lead.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Error",
        description: "Failed to save lead",
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
            {lead ? 'Edit Lead' : 'Create New Lead'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lead_name">Lead Name *</Label>
              <Input
                id="lead_name"
                value={formData.lead_name}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="phone_no">Phone</Label>
              <Input
                id="phone_no"
                value={formData.phone_no || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_no: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="mobile_no">Mobile</Label>
              <Input
                id="mobile_no"
                value={formData.mobile_no || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile_no: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.linkedin || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="contact_source">Contact Source</Label>
              <Select
                value={formData.contact_source || 'Other'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, contact_source: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Trade Show">Trade Show</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="lead_status">Lead Status</Label>
              <Select
                value={formData.lead_status || 'New'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, lead_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.industry || 'Other'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automotive">Automotive</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
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
              {loading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

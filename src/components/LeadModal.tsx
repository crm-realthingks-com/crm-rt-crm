
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const leadSchema = z.object({
  lead_name: z.string().min(1, "Lead name is required").trim(),
  company_name: z.string().min(1, "Company name is required").trim(),
  position: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone_no: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  lead_source: z.string().optional(),
  lead_status: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  lead_source?: string;
  lead_status?: string;
  industry?: string;
  country?: string;
  region?: string;
  status?: string;
  description?: string;
  contact_owner?: string;
  created_by?: string;
  modified_by?: string;
}

interface LeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSuccess: () => void;
}

const leadSources = [
  "Website",
  "LinkedIn",
  "Referral",
  "Cold Call",
  "Email",
  "Social Media",
  "Event",
  "Partner",
  "Advertisement",
  "Other"
];

const leadStatuses = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost"
];

const industries = [
  "Automotive",
  "Technology",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Other"
];

const regions = [
  "EU",
  "US", 
  "Asia",
  "Other"
];

const statuses = [
  "New",
  "Contacted",
  "Qualified"
];

export const LeadModal = ({ open, onOpenChange, lead, onSuccess }: LeadModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      lead_name: "",
      company_name: "",
      position: "",
      email: "",
      phone_no: "",
      linkedin: "",
      website: "",
      lead_source: "",
      lead_status: "",
      industry: "Automotive",
      country: "",
      region: "EU",
      status: "New",
      description: "",
    },
  });

  useEffect(() => {
    if (lead) {
      console.log('LeadModal: Setting form values for lead:', lead);
      form.reset({
        lead_name: lead.lead_name || "",
        company_name: lead.company_name || "",
        position: lead.position || "",
        email: lead.email || "",
        phone_no: lead.phone_no || "",
        linkedin: lead.linkedin || "",
        website: lead.website || "",
        lead_source: lead.lead_source || "",
        lead_status: lead.lead_status || "",
        industry: lead.industry || "Automotive",
        country: lead.country || "",
        region: lead.region || "EU",
        status: lead.status || "New",
        description: lead.description || "",
      });
    } else {
      form.reset({
        lead_name: "",
        company_name: "",
        position: "",
        email: "",
        phone_no: "",
        linkedin: "",
        website: "",
        lead_source: "",
        lead_status: "",
        industry: "Automotive",
        country: "",
        region: "EU",
        status: "New",
        description: "",
      });
    }
  }, [lead, form]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      setLoading(true);
      console.log('LeadModal: Submitting form data:', data);
      console.log('LeadModal: Lead being edited:', lead);
      
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        });
        return;
      }

      // Prepare the lead data with proper validation and trimming
      const leadData = {
        lead_name: data.lead_name.trim(),
        company_name: data.company_name.trim(),
        position: data.position?.trim() || null,
        email: data.email?.trim() || null,
        phone_no: data.phone_no?.trim() || null,
        linkedin: data.linkedin?.trim() || null,
        website: data.website?.trim() || null,
        lead_source: data.lead_source?.trim() || null,
        lead_status: data.lead_status?.trim() || null,
        industry: data.industry?.trim() || null,
        country: data.country?.trim() || null,
        region: data.region?.trim() || "EU",
        status: data.status?.trim() || "New",
        description: data.description?.trim() || null,
        modified_by: user.data.user.id,
        modified_time: new Date().toISOString(),
      };

      // Additional validation for URLs if provided
      if (leadData.linkedin && leadData.linkedin !== '' && !leadData.linkedin.startsWith('http')) {
        leadData.linkedin = `https://${leadData.linkedin}`;
      }
      
      if (leadData.website && leadData.website !== '' && !leadData.website.startsWith('http')) {
        leadData.website = `https://${leadData.website}`;
      }

      console.log('LeadModal: Prepared lead data:', leadData);

      if (lead?.id) {
        // Update existing lead
        console.log('LeadModal: Updating lead with ID:', lead.id);
        
        const { data: updatedData, error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', lead.id)
          .select();

        if (error) {
          console.error('LeadModal: Update error:', error);
          throw error;
        }

        console.log('LeadModal: Lead updated successfully:', updatedData);
        toast({
          title: "Success",
          description: "Lead updated successfully",
        });
      } else {
        // Create new lead
        console.log('LeadModal: Creating new lead');
        const newLeadData = {
          ...leadData,
          created_by: user.data.user.id,
          contact_owner: user.data.user.id,
          created_time: new Date().toISOString(),
        };
        
        const { data: newData, error } = await supabase
          .from('leads')
          .insert(newLeadData)
          .select();

        if (error) {
          console.error('LeadModal: Insert error:', error);
          throw error;
        }

        console.log('LeadModal: Lead created successfully:', newData);
        toast({
          title: "Success",
          description: "Lead created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('LeadModal: Submit error:', error);
      
      // Provide more specific error messages
      let errorMessage = "An unexpected error occurred";
      if (error.message?.includes('lead_name')) {
        errorMessage = "Lead name is required and cannot be empty";
      } else if (error.message?.includes('company_name')) {
        errorMessage = "Company name is required and cannot be empty";
      } else if (error.message?.includes('email')) {
        errorMessage = "Please provide a valid email address";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
            {lead ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lead_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Acme Corp" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="CEO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://acme.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lead_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
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
                name="lead_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
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
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="United States" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "EU"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "New"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the lead..."
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
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : lead ? "Save Changes" : "Add Lead"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

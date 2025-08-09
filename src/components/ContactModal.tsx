
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

const contactSchema = z.object({
  contact_name: z.string().min(1, "Contact name is required"),
  company_name: z.string().min(1, "Company name is required"),
  position: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone_no: z.string().optional(),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  contact_source: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface Contact {
  id: string;
  contact_name: string;
  company_name?: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  description?: string;
  contact_owner?: string;
  created_by?: string;
  modified_by?: string;
}

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSuccess: () => void;
}

const contactSources = [
  "Website",
  "Referral", 
  "Social Media",
  "Email Campaign",
  "Trade Show",
  "Cold Call",
  "LinkedIn",
  "Other"
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

export const ContactModal = ({ open, onOpenChange, contact, onSuccess }: ContactModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_name: "",
      company_name: "",
      position: "",
      email: "",
      phone_no: "",
      linkedin: "",
      website: "",
      contact_source: "",
      industry: "Automotive",
      description: "",
    },
  });

  useEffect(() => {
    if (contact) {
      console.log('ContactModal: Setting form values for contact:', contact);
      form.reset({
        contact_name: contact.contact_name || "",
        company_name: contact.company_name || "",
        position: contact.position || "",
        email: contact.email || "",
        phone_no: contact.phone_no || "",
        linkedin: contact.linkedin || "",
        website: contact.website || "",
        contact_source: contact.contact_source || "",
        industry: contact.industry || "Automotive",
        description: contact.description || "",
      });
    } else {
      form.reset({
        contact_name: "",
        company_name: "",
        position: "",
        email: "",
        phone_no: "",
        linkedin: "",
        website: "",
        contact_source: "",
        industry: "Automotive",
        description: "",
      });
    }
  }, [contact, form]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      setLoading(true);
      console.log('ContactModal: Submitting form data:', data);
      
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        });
        return;
      }

      // Prepare the contact data with exact field names matching the database
      const contactData = {
        contact_name: data.contact_name.trim(),
        company_name: data.company_name?.trim() || null,
        position: data.position?.trim() || null,
        email: data.email?.trim() || null,
        phone_no: data.phone_no?.trim() || null,
        linkedin: data.linkedin?.trim() || null,
        website: data.website?.trim() || null,
        contact_source: data.contact_source?.trim() || null,
        industry: data.industry?.trim() || null,
        description: data.description?.trim() || null,
        modified_by: user.data.user.id,
      };

      if (contact) {
        // Update existing contact
        console.log('ContactModal: Updating contact with ID:', contact.id, 'Data:', contactData);
        
        const { error } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contact.id);

        if (error) {
          console.error('ContactModal: Update error:', error);
          throw error;
        }

        console.log('ContactModal: Contact updated successfully');
        toast({
          title: "Success",
          description: "Contact updated successfully",
        });
      } else {
        // Create new contact
        console.log('ContactModal: Creating new contact');
        const newContactData = {
          ...contactData,
          created_by: user.data.user.id,
          contact_owner: user.data.user.id,
        };
        
        const { error } = await supabase
          .from('contacts')
          .insert(newContactData);

        if (error) {
          console.error('ContactModal: Insert error:', error);
          throw error;
        }

        console.log('ContactModal: Contact created successfully');
        toast({
          title: "Success",
          description: "Contact created successfully",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('ContactModal: Submit error:', error);
      toast({
        title: "Error",
        description: error.message || (contact ? "Failed to update contact" : "Failed to create contact"),
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
            {contact ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="Acme Corp" {...field} />
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
                name="contact_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactSources.map((source) => (
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
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the contact..."
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
                {loading ? "Saving..." : contact ? "Save Changes" : "Add Contact"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

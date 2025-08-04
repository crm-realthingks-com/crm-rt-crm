
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

export interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
}

interface LeadSearchableDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const LeadSearchableDropdown = ({
  value,
  onValueChange,
  placeholder = "Search leads...",
  className,
}: LeadSearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("leads")
          .select("id, lead_name, company_name, email, phone_no")
          .order("lead_name");

        if (error) {
          console.error("Error fetching leads:", error);
          setLeads([]);
        } else {
          setLeads(data || []);
        }
      } catch (error) {
        console.error("Error in fetchLeads:", error);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchLeads();
    }
  }, [open]);

  const selectedLead = leads.find((lead) => lead.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedLead ? (
            <span className="truncate">
              {selectedLead.lead_name}
              {selectedLead.company_name && (
                <span className="text-muted-foreground ml-1">
                  ({selectedLead.company_name})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search leads..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading leads..." : "No leads found."}
            </CommandEmpty>
            <CommandGroup>
              {leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={`${lead.lead_name} ${lead.company_name || ""}`}
                  onSelect={() => {
                    onValueChange(lead.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.lead_name}</span>
                    {lead.company_name && (
                      <span className="text-sm text-muted-foreground">
                        {lead.company_name}
                      </span>
                    )}
                    {lead.email && (
                      <span className="text-xs text-muted-foreground">
                        {lead.email}
                      </span>
                    )}
                  </div>
                  <Check
                    className={cn(
                      "ml-2 h-4 w-4",
                      value === lead.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

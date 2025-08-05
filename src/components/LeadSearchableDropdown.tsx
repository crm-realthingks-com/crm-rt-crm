
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  contact_name?: string;
}

interface LeadSearchableDropdownProps {
  value?: string;
  onLeadSelect: (lead: Lead) => void;
  onCreateNew: () => void;
  placeholder?: string;
}

export const LeadSearchableDropdown = ({ 
  value, 
  onLeadSelect, 
  onCreateNew, 
  placeholder = "Search leads..." 
}: LeadSearchableDropdownProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const fetchLeads = async (search?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('id, lead_name, company_name, contact_name')
        .eq('user_id', user.id)
        .order('lead_name');

      if (search) {
        query = query.or(`lead_name.ilike.%${search}%,company_name.ilike.%${search}%,contact_name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLeads();
    }
  }, [open, user]);

  useEffect(() => {
    if (searchValue) {
      const timer = setTimeout(() => {
        fetchLeads(searchValue);
      }, 300);
      return () => clearTimeout(timer);
    } else if (open) {
      fetchLeads();
    }
  }, [searchValue]);

  const selectedLead = leads.find(lead => lead.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedLead ? (
            <span className="truncate">
              {selectedLead.lead_name} {selectedLead.company_name && `(${selectedLead.company_name})`}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Search leads..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading..." : "No leads found."}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onCreateNew();
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new lead
              </CommandItem>
              {leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={lead.id}
                  onSelect={() => {
                    onLeadSelect(lead);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === lead.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{lead.lead_name}</span>
                    {lead.company_name && (
                      <span className="text-sm text-muted-foreground">{lead.company_name}</span>
                    )}
                    {lead.contact_name && (
                      <span className="text-sm text-muted-foreground">{lead.contact_name}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

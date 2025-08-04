import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { forwardRef, useState } from "react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DEAL_STAGES } from "@/types/deal";
import { LeadSearchableDropdown } from "@/components/searchable-dropdown/LeadSearchableDropdown";

interface FormFieldProps {
  field: string;
  value: any;
  onChange: (value: any) => void;
  label?: string;
}

export const FormFieldRenderer = ({ field, value, onChange, label }: FormFieldProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onChange(checked ? 'Yes' : 'No');
  };

  const handleSelectChange = (value: string) => {
    onChange(value);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseFloat(e.target.value);
    onChange(isNaN(parsedValue) ? null : parsedValue);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseFloat(e.target.value);
    onChange(isNaN(parsedValue) ? null : parsedValue);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange(undefined);
    }
  };

  const DatePicker = forwardRef<HTMLButtonElement, {
    className?: string;
  }>(({ className }, ref) => {
    const [date, setDate] = useState<Date | undefined>(value ? new Date(value) : undefined);

    const handleDateSelect = (newDate: Date | undefined) => {
      setDate(newDate);
      handleDateChange(newDate);
    };

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "yyyy-MM-dd") : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center" side="bottom">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) =>
              date > new Date()
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  });
  DatePicker.displayName = "DatePicker"

  return (
    <div className="grid gap-2">
      {field === 'deal_name' && (
        <Input id={field} value={value} onChange={handleChange} />
      )}
      {field === 'company_name' && (
        <Input id={field} value={value} onChange={handleChange} />
      )}
      {field === 'lead_name' && (
        <LeadSearchableDropdown
          value={value}
          onValueChange={(val) => onChange(val)}
          placeholder="Select or enter lead name"
        />
      )}
      {field === 'lead_owner' && (
        <Input id={field} value={value} onChange={handleChange} />
      )}
      {field === 'region' && (
        <Input id={field} value={value} onChange={handleChange} />
      )}
      {field === 'phone_no' && (
        <Input id={field} type="tel" value={value} onChange={handleChange} />
      )}
      {field === 'lead_description' && (
        <Textarea id={field} value={value} onChange={handleChange} />
      )}
      {field === 'lead_source' && (
        <Select onValueChange={handleSelectChange} defaultValue={value || ''}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select lead source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cold Calling">Cold Calling</SelectItem>
            <SelectItem value="Email Campaign">Email Campaign</SelectItem>
            <SelectItem value="Social Media">Social Media</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
            <SelectItem value="Website">Website</SelectItem>
            <SelectItem value="Event">Event</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      )}
      {field === 'expected_closing_date' && (
        <DatePicker />
      )}
      {field === 'discussion_date' && (
        <DatePicker />
      )}
      {field === 'discussion_notes' && (
        <Textarea id={field} value={value} onChange={handleChange} />
      )}
      {field === 'next_follow_up' && (
        <Input id={field} value={value} onChange={handleChange} />
      )}
      {field === 'budget' && (
        <Input id={field} type="number" value={value || ''} onChange={handleNumberChange} />
      )}
      {field === 'qualified_notes' && (
        <Textarea id={field} value={value} onChange={handleChange} />
      )}
      {field === 'decision_maker' && (
        <Input id={field} value={value} onChange={handleChange} />
      )}
      {field === 'total_contract_value' && (
        <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />
      )}
      {field === 'rfq_sent_date' && (
        <DatePicker />
      )}
      {field === 'rfq_deadline' && (
        <DatePicker />
      )}
      {field === 'rfq_requirements' && (
        <Textarea id={field} value={value} onChange={handleChange} />
      )}
      {field === 'timeline' && (
        <Input id={field} value={value} onChange={handleChange} />
      )}
      {field === 'offer_amount' && (
        <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />
      )}
      {field === 'offer_date' && (
        <DatePicker />
      )}
      {field === 'offer_valid_until' && (
        <DatePicker />
      )}
      {field === 'offer_terms' && (
        <Textarea id={field} value={value} onChange={handleChange} />
      )}
      {field === 'negotiation_status' && (
        <Input id={field} value={value} onChange={handleChange} />
      )}
      {field === 'close_date' && (
        <DatePicker />
      )}
      {field === 'close_amount' && (
        <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />
      )}
      {field === 'close_reason' && (
        <Textarea id={field} value={value} onChange={handleChange} />
      )}
      {field === 'total_revenue' && (
        <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />
      )}
      {field === 'quarterly_revenue_q1' && (
        <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />
      )}
      {field === 'quarterly_revenue_q2' && (
        <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />
      )}
      {field === 'quarterly_revenue_q3' && (
        <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />
      )}
      {field === 'quarterly_revenue_q4' && (
        <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />
      )}
      {field === 'closing_date' && (
        <DatePicker />
      )}
      {field === 'signed_contract_date' && (
        <DatePicker />
      )}
    </div>
  );
};

import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";


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
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormFieldProps {
  field: string;
  value: any;
  onChange: (value: any) => void;
  label?: string;
  error?: string;
}

export const FormFieldRenderer = ({ field, value, onChange, label, error }: FormFieldProps) => {
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
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  });
  DatePicker.displayName = "DatePicker"

  const renderField = () => {
    switch (field) {
      case 'project_name':
      case 'customer_name':
      case 'lead_owner':
      case 'region':
      case 'customer_need':
      case 'budget':
      case 'current_status':
      case 'closing':
      case 'won_reason':
      case 'lost_reason':
      case 'need_improvement':
      case 'drop_reason':
        return <Input id={field} value={value || ''} onChange={handleChange} />;
      
      case 'lead_name':
        return <Input id={field} value={value || ''} onChange={handleChange} placeholder="Enter lead name" />;
      
      case 'priority':
      case 'probability':
      case 'project_duration':
        return <Input id={field} type="number" value={value || ''} onChange={handleNumberChange} />;
      
      case 'total_contract_value':
      case 'quarterly_revenue_q1':
      case 'quarterly_revenue_q2':
      case 'quarterly_revenue_q3':
      case 'quarterly_revenue_q4':
      case 'total_revenue':
        return <Input id={field} type="number" value={value || ''} onChange={handleCurrencyChange} />;
      
      case 'expected_closing_date':
      case 'start_date':
      case 'end_date':
      case 'rfq_received_date':
      case 'proposal_due_date':
      case 'signed_contract_date':
      case 'implementation_start_date':
        return <DatePicker />;
      
      case 'internal_comment':
      case 'action_items':
        return <Textarea id={field} value={value || ''} onChange={handleChange} />;
      
      case 'relationship_strength':
        return (
          <Select onValueChange={handleSelectChange} defaultValue={value || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select relationship strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'customer_challenges':
      case 'business_value':
      case 'decision_maker_level':
        return (
          <Select onValueChange={handleSelectChange} defaultValue={value || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'is_recurring':
        return (
          <Select onValueChange={handleSelectChange} defaultValue={value || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Is recurring?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Unclear">Unclear</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'currency_type':
        return (
          <Select onValueChange={handleSelectChange} defaultValue={value || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="INR">INR</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'rfq_status':
        return (
          <Select onValueChange={handleSelectChange} defaultValue={value || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select RFQ status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Drafted">Drafted</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'handoff_status':
        return (
          <Select onValueChange={handleSelectChange} defaultValue={value || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select handoff status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        );
      
      default:
        return <Input id={field} value={value || ''} onChange={handleChange} />;
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={field}>
        {label || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Label>
      {renderField()}
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  );
};

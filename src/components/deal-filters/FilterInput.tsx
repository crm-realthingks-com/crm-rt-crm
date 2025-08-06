
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FilterInputProps {
  label: string;
  type: 'text' | 'number' | 'date' | 'multiselect';
  value?: any;
  onChange: (value: any) => void;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export const FilterInput = ({
  label,
  type,
  value,
  onChange,
  options = [],
  placeholder,
  min,
  max
}: FilterInputProps) => {
  if (type === 'multiselect') {
    const selectedValues = Array.isArray(value) ? value : [];
    
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        <Select onValueChange={(newValue) => {
          if (!selectedValues.includes(newValue)) {
            onChange([...selectedValues, newValue]);
          }
        }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={placeholder || `Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedValues.map(val => (
              <Badge key={val} variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                {val}
                <X 
                  className="w-2.5 h-2.5 ml-1 cursor-pointer" 
                  onClick={() => onChange(selectedValues.filter(v => v !== val))}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) || undefined : e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="h-8 text-xs"
      />
    </div>
  );
};

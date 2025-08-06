
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
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Select onValueChange={(newValue) => {
          if (!selectedValues.includes(newValue)) {
            onChange([...selectedValues, newValue]);
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder || `Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedValues.map(val => (
              <Badge key={val} variant="secondary" className="text-xs">
                {val}
                <X 
                  className="w-3 h-3 ml-1 cursor-pointer" 
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
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) || undefined : e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
      />
    </div>
  );
};

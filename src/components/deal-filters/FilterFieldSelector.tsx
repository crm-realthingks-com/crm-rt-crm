
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { DealFilters, FilterField } from "@/types/filters";

const AVAILABLE_FILTER_FIELDS: FilterField[] = [
  { key: 'stages', label: 'Stage', type: 'multiselect' },
  { key: 'leadOwners', label: 'Lead Owner', type: 'multiselect' },
  { key: 'customers', label: 'Customer', type: 'multiselect' },
  { key: 'priorities', label: 'Priority', type: 'multiselect' },
  { key: 'expectedCloseDateFrom', label: 'Expected Close From', type: 'date' },
  { key: 'expectedCloseDateTo', label: 'Expected Close To', type: 'date' },
  { key: 'totalContractValueMin', label: 'Min Contract Value', type: 'number' },
  { key: 'totalContractValueMax', label: 'Max Contract Value', type: 'number' },
  { key: 'regions', label: 'Region', type: 'multiselect' },
  { key: 'currencies', label: 'Currency', type: 'multiselect' },
  { key: 'projectNames', label: 'Project Name', type: 'multiselect' },
  { key: 'leadNames', label: 'Lead Name', type: 'multiselect' },
  { key: 'businessValues', label: 'Business Value', type: 'multiselect' },
  { key: 'decisionMakerLevels', label: 'Decision Maker Level', type: 'multiselect' },
  { key: 'rfqStatuses', label: 'RFQ Status', type: 'multiselect' },
  { key: 'handoffStatuses', label: 'Handoff Status', type: 'multiselect' },
  { key: 'isRecurring', label: 'Is Recurring', type: 'multiselect' },
  { key: 'relationshipStrengths', label: 'Relationship Strength', type: 'multiselect' },
  { key: 'customerChallenges', label: 'Customer Challenges', type: 'multiselect' },
  { key: 'createdDateFrom', label: 'Created From', type: 'date' },
  { key: 'createdDateTo', label: 'Created To', type: 'date' },
  { key: 'modifiedDateFrom', label: 'Modified From', type: 'date' },
  { key: 'modifiedDateTo', label: 'Modified To', type: 'date' },
];

interface FilterFieldSelectorProps {
  filters: DealFilters;
  onFiltersChange: (filters: DealFilters) => void;
  uniqueValues: {
    leadOwners: string[];
    customers: string[];
    regions: string[];
    currencies: string[];
    projectNames: string[];
    leadNames: string[];
    budgets: string[];
    businessValues: string[];
    decisionMakerLevels: string[];
    rfqStatuses: string[];
    handoffStatuses: string[];
    relationshipStrengths: string[];
    customerChallenges: string[];
  };
}

export const FilterFieldSelector = ({ filters, onFiltersChange, uniqueValues }: FilterFieldSelectorProps) => {
  const [selectedValue, setSelectedValue] = useState<string>('');

  // Get currently selected fields from the filters object
  const selectedFields = Object.keys(filters).filter(key => {
    const value = filters[key as keyof DealFilters];
    // Check if the value is meaningful (not empty array, not empty string, not undefined)
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== '' && value !== null;
  });

  const addField = (fieldKey: string) => {
    if (!selectedFields.includes(fieldKey)) {
      // Initialize the field with appropriate default value based on type
      const field = AVAILABLE_FILTER_FIELDS.find(f => f.key === fieldKey);
      if (field) {
        const newFilters = { ...filters } as any;
        if (field.type === 'multiselect') {
          newFilters[fieldKey] = [];
        } else if (field.type === 'number') {
          // For number fields, we'll let the user set the value
        } else if (field.type === 'date') {
          // For date fields, we'll let the user set the value
        }
        onFiltersChange(newFilters as DealFilters);
      }
    }
    setSelectedValue('');
  };

  const removeField = (fieldKey: string) => {
    const newFilters = { ...filters };
    delete (newFilters as any)[fieldKey];
    onFiltersChange(newFilters);
  };

  const availableFields = AVAILABLE_FILTER_FIELDS.filter(
    field => !selectedFields.includes(field.key)
  );

  const getFieldLabel = (key: string) => {
    return AVAILABLE_FILTER_FIELDS.find(field => field.key === key)?.label || key;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Select Fields:</span>
        <Select value={selectedValue} onValueChange={addField}>
          <SelectTrigger className="w-[160px] h-7 text-xs">
            <SelectValue placeholder="Add filter" />
          </SelectTrigger>
          <SelectContent className="z-50">
            {availableFields.map(field => (
              <SelectItem key={field.key} value={field.key} className="text-xs">
                {field.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => selectedValue && addField(selectedValue)}
          disabled={!selectedValue}
          className="h-7 w-7 p-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {selectedFields.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedFields.map(fieldKey => (
            <Badge key={fieldKey} variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
              {getFieldLabel(fieldKey)}
              <X 
                className="w-2.5 h-2.5 ml-1 cursor-pointer hover:text-destructive" 
                onClick={() => removeField(fieldKey)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

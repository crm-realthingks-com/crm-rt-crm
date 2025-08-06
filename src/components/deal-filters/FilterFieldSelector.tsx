
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'multiselect';
}

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
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export const FilterFieldSelector = ({ selectedFields, onFieldsChange }: FilterFieldSelectorProps) => {
  const [selectedValue, setSelectedValue] = useState<string>('');

  const addField = (fieldKey: string) => {
    if (!selectedFields.includes(fieldKey)) {
      onFieldsChange([...selectedFields, fieldKey]);
    }
    setSelectedValue('');
  };

  const removeField = (fieldKey: string) => {
    onFieldsChange(selectedFields.filter(key => key !== fieldKey));
  };

  const availableFields = AVAILABLE_FILTER_FIELDS.filter(
    field => !selectedFields.includes(field.key)
  );

  const getFieldLabel = (key: string) => {
    return AVAILABLE_FILTER_FIELDS.find(field => field.key === key)?.label || key;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={selectedValue} onValueChange={addField}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Add filter field" />
          </SelectTrigger>
          <SelectContent>
            {availableFields.map(field => (
              <SelectItem key={field.key} value={field.key}>
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
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {selectedFields.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFields.map(fieldKey => (
            <Badge key={fieldKey} variant="secondary" className="text-xs">
              {getFieldLabel(fieldKey)}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => removeField(fieldKey)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

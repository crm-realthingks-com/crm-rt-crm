import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FilterInput } from "./FilterInput";
import { FilterFieldSelector } from "./FilterFieldSelector";
import { SavedFiltersManager } from "./SavedFiltersManager";
import { DealFilters } from "@/types/filters";
import { DEAL_STAGES } from "@/types/deal";
import { ChevronDown, ChevronUp, Filter, X, Check, RefreshCw } from "lucide-react";

interface DealsFilterPanelProps {
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
  onRefresh?: () => void;
}

export const DealsFilterPanel = ({ filters, onFiltersChange, uniqueValues, onRefresh }: DealsFilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilterFields, setSelectedFilterFields] = useState<string[]>([]);
  const [tempFilters, setTempFilters] = useState<DealFilters>({});

  const updateTempFilter = (key: keyof DealFilters, value: any) => {
    setTempFilters({ ...tempFilters, [key]: value });
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
  };

  const clearAllFilters = () => {
    setTempFilters({});
    onFiltersChange({});
    setSelectedFilterFields([]);
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '';
  });

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '';
    }).length;
  };

  const getFilterInputProps = (fieldKey: string) => {
    switch (fieldKey) {
      case 'stages':
        return {
          label: 'Stage',
          type: 'multiselect' as const,
          options: DEAL_STAGES,
          placeholder: 'Select stages'
        };
      case 'leadOwners':
        return {
          label: 'Lead Owner',
          type: 'multiselect' as const,
          options: uniqueValues.leadOwners,
          placeholder: 'Select lead owners'
        };
      case 'customers':
        return {
          label: 'Customer',
          type: 'multiselect' as const,
          options: uniqueValues.customers,
          placeholder: 'Select customers'
        };
      case 'priorities':
        return {
          label: 'Priority',
          type: 'multiselect' as const,
          options: ['1', '2', '3', '4', '5'],
          placeholder: 'Select priorities'
        };
      case 'expectedCloseDateFrom':
        return {
          label: 'Expected Close From',
          type: 'date' as const
        };
      case 'expectedCloseDateTo':
        return {
          label: 'Expected Close To',
          type: 'date' as const
        };
      case 'totalContractValueMin':
        return {
          label: 'Min Contract Value',
          type: 'number' as const,
          placeholder: 'Min value',
          min: 0
        };
      case 'totalContractValueMax':
        return {
          label: 'Max Contract Value',
          type: 'number' as const,
          placeholder: 'Max value',
          min: 0
        };
      case 'regions':
        return {
          label: 'Region',
          type: 'multiselect' as const,
          options: uniqueValues.regions,
          placeholder: 'Select regions'
        };
      case 'currencies':
        return {
          label: 'Currency',
          type: 'multiselect' as const,
          options: uniqueValues.currencies,
          placeholder: 'Select currencies'
        };
      case 'projectNames':
        return {
          label: 'Project Name',
          type: 'multiselect' as const,
          options: uniqueValues.projectNames,
          placeholder: 'Select projects'
        };
      case 'leadNames':
        return {
          label: 'Lead Name',
          type: 'multiselect' as const,
          options: uniqueValues.leadNames,
          placeholder: 'Select leads'
        };
      case 'businessValues':
        return {
          label: 'Business Value',
          type: 'multiselect' as const,
          options: uniqueValues.businessValues,
          placeholder: 'Select business values'
        };
      case 'decisionMakerLevels':
        return {
          label: 'Decision Maker Level',
          type: 'multiselect' as const,
          options: uniqueValues.decisionMakerLevels,
          placeholder: 'Select decision maker levels'
        };
      case 'rfqStatuses':
        return {
          label: 'RFQ Status',
          type: 'multiselect' as const,
          options: uniqueValues.rfqStatuses,
          placeholder: 'Select RFQ statuses'
        };
      case 'handoffStatuses':
        return {
          label: 'Handoff Status',
          type: 'multiselect' as const,
          options: uniqueValues.handoffStatuses,
          placeholder: 'Select handoff statuses'
        };
      case 'isRecurring':
        return {
          label: 'Is Recurring',
          type: 'multiselect' as const,
          options: ['Yes', 'No', 'Unclear'],
          placeholder: 'Select recurring status'
        };
      case 'relationshipStrengths':
        return {
          label: 'Relationship Strength',
          type: 'multiselect' as const,
          options: uniqueValues.relationshipStrengths,
          placeholder: 'Select relationship strengths'
        };
      case 'customerChallenges':
        return {
          label: 'Customer Challenges',
          type: 'multiselect' as const,
          options: uniqueValues.customerChallenges,
          placeholder: 'Select customer challenges'
        };
      case 'createdDateFrom':
        return {
          label: 'Created From',
          type: 'date' as const
        };
      case 'createdDateTo':
        return {
          label: 'Created To',
          type: 'date' as const
        };
      case 'modifiedDateFrom':
        return {
          label: 'Modified From',
          type: 'date' as const
        };
      case 'modifiedDateTo':
        return {
          label: 'Modified To',
          type: 'date' as const
        };
      default:
        return {
          label: fieldKey,
          type: 'text' as const
        };
    }
  };

  return (
    <Card className="mb-3 border-border/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-2 px-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" />
                <span>Search Filters</span>
                {hasActiveFilters && (
                  <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="px-3 pb-2 pt-0 space-y-2">
            {/* Single row with field selector and action buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/30">
              <div className="flex-1 min-w-[200px]">
                <FilterFieldSelector
                  selectedFields={selectedFilterFields}
                  onFieldsChange={setSelectedFilterFields}
                />
              </div>
              
              <div className="flex items-center gap-1">
                <Button onClick={applyFilters} size="sm" className="h-7 text-xs px-2">
                  <Check className="w-3 h-3 mr-1" />
                  Apply
                </Button>
                
                <SavedFiltersManager
                  currentFilters={tempFilters}
                  onLoadFilters={(loadedFilters) => {
                    setTempFilters(loadedFilters);
                    const fieldsWithValues = Object.keys(loadedFilters).filter(key => {
                      const value = loadedFilters[key as keyof DealFilters];
                      if (Array.isArray(value)) return value.length > 0;
                      return value !== undefined && value !== '';
                    });
                    setSelectedFilterFields(fieldsWithValues);
                  }}
                />
                
                <Button variant="outline" onClick={clearAllFilters} size="sm" className="h-7 text-xs px-2">
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
                
                {onRefresh && (
                  <Button variant="outline" onClick={onRefresh} size="sm" className="h-7 text-xs px-2">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Selected Filter Inputs */}
            {selectedFilterFields.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {selectedFilterFields.map(fieldKey => {
                  const inputProps = getFilterInputProps(fieldKey);
                  return (
                    <FilterInput
                      key={fieldKey}
                      {...inputProps}
                      value={tempFilters[fieldKey as keyof DealFilters] || (inputProps.type === 'multiselect' ? [] : '')}
                      onChange={(value) => updateTempFilter(fieldKey as keyof DealFilters, value)}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

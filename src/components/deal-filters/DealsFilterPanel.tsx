
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FilterInput } from "./FilterInput";
import { SavedFiltersManager } from "./SavedFiltersManager";
import { DealFilters } from "@/types/filters";
import { DEAL_STAGES } from "@/types/deal";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

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
}

export const DealsFilterPanel = ({ filters, onFiltersChange, uniqueValues }: DealsFilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof DealFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
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

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <span>Search Filters</span>
                {hasActiveFilters && (
                  <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    {getActiveFilterCount()}
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Filter Actions */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b">
              <SavedFiltersManager
                currentFilters={filters}
                onLoadFilters={onFiltersChange}
              />
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Core Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <FilterInput
                label="Stage"
                type="multiselect"
                value={filters.stages || []}
                onChange={(value) => updateFilter('stages', value)}
                options={DEAL_STAGES}
                placeholder="Select stages"
              />
              
              <FilterInput
                label="Lead Owner"
                type="multiselect"
                value={filters.leadOwners || []}
                onChange={(value) => updateFilter('leadOwners', value)}
                options={uniqueValues.leadOwners}
                placeholder="Select lead owners"
              />
              
              <FilterInput
                label="Customer"
                type="multiselect"
                value={filters.customers || []}
                onChange={(value) => updateFilter('customers', value)}
                options={uniqueValues.customers}
                placeholder="Select customers"
              />
              
              <FilterInput
                label="Priority"
                type="multiselect"
                value={filters.priorities || []}
                onChange={(value) => updateFilter('priorities', value)}
                options={['1', '2', '3', '4', '5']}
                placeholder="Select priorities"
              />
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterInput
                label="Expected Close From"
                type="date"
                value={filters.expectedCloseDateFrom || ''}
                onChange={(value) => updateFilter('expectedCloseDateFrom', value)}
              />
              
              <FilterInput
                label="Expected Close To"
                type="date"
                value={filters.expectedCloseDateTo || ''}
                onChange={(value) => updateFilter('expectedCloseDateTo', value)}
              />
              
              <FilterInput
                label="Min Contract Value"
                type="number"
                value={filters.totalContractValueMin || ''}
                onChange={(value) => updateFilter('totalContractValueMin', value)}
                placeholder="Min value"
                min={0}
              />
              
              <FilterInput
                label="Max Contract Value"
                type="number"
                value={filters.totalContractValueMax || ''}
                onChange={(value) => updateFilter('totalContractValueMax', value)}
                placeholder="Max value"
                min={0}
              />
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <FilterInput
                label="Region"
                type="multiselect"
                value={filters.regions || []}
                onChange={(value) => updateFilter('regions', value)}
                options={uniqueValues.regions}
                placeholder="Select regions"
              />
              
              <FilterInput
                label="Currency"
                type="multiselect"
                value={filters.currencies || []}
                onChange={(value) => updateFilter('currencies', value)}
                options={uniqueValues.currencies}
                placeholder="Select currencies"
              />
              
              <FilterInput
                label="Project Name"
                type="multiselect"
                value={filters.projectNames || []}
                onChange={(value) => updateFilter('projectNames', value)}
                options={uniqueValues.projectNames}
                placeholder="Select projects"
              />
              
              <FilterInput
                label="Lead Name"
                type="multiselect"
                value={filters.leadNames || []}
                onChange={(value) => updateFilter('leadNames', value)}
                options={uniqueValues.leadNames}
                placeholder="Select leads"
              />
            </div>

            {/* Business Process Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <FilterInput
                label="Business Value"
                type="multiselect"
                value={filters.businessValues || []}
                onChange={(value) => updateFilter('businessValues', value)}
                options={uniqueValues.businessValues}
                placeholder="Select business values"
              />
              
              <FilterInput
                label="Decision Maker Level"
                type="multiselect"
                value={filters.decisionMakerLevels || []}
                onChange={(value) => updateFilter('decisionMakerLevels', value)}
                options={uniqueValues.decisionMakerLevels}
                placeholder="Select decision maker levels"
              />
              
              <FilterInput
                label="RFQ Status"
                type="multiselect"
                value={filters.rfqStatuses || []}
                onChange={(value) => updateFilter('rfqStatuses', value)}
                options={uniqueValues.rfqStatuses}
                placeholder="Select RFQ statuses"
              />
              
              <FilterInput
                label="Handoff Status"
                type="multiselect"
                value={filters.handoffStatuses || []}
                onChange={(value) => updateFilter('handoffStatuses', value)}
                options={uniqueValues.handoffStatuses}
                placeholder="Select handoff statuses"
              />
            </div>

            {/* Relationship Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FilterInput
                label="Is Recurring"
                type="multiselect"
                value={filters.isRecurring || []}
                onChange={(value) => updateFilter('isRecurring', value)}
                options={['Yes', 'No', 'Unclear']}
                placeholder="Select recurring status"
              />
              
              <FilterInput
                label="Relationship Strength"
                type="multiselect"
                value={filters.relationshipStrengths || []}
                onChange={(value) => updateFilter('relationshipStrengths', value)}
                options={uniqueValues.relationshipStrengths}
                placeholder="Select relationship strengths"
              />
              
              <FilterInput
                label="Customer Challenges"
                type="multiselect"
                value={filters.customerChallenges || []}
                onChange={(value) => updateFilter('customerChallenges', value)}
                options={uniqueValues.customerChallenges}
                placeholder="Select customer challenges"
              />
            </div>

            {/* Date Created/Modified Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterInput
                label="Created From"
                type="date"
                value={filters.createdDateFrom || ''}
                onChange={(value) => updateFilter('createdDateFrom', value)}
              />
              
              <FilterInput
                label="Created To"
                type="date"
                value={filters.createdDateTo || ''}
                onChange={(value) => updateFilter('createdDateTo', value)}
              />
              
              <FilterInput
                label="Modified From"
                type="date"
                value={filters.modifiedDateFrom || ''}
                onChange={(value) => updateFilter('modifiedDateFrom', value)}
              />
              
              <FilterInput
                label="Modified To"
                type="date"
                value={filters.modifiedDateTo || ''}
                onChange={(value) => updateFilter('modifiedDateTo', value)}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

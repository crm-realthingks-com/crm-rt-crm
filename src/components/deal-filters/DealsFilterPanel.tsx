
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterFieldSelector } from "./FilterFieldSelector";
import { SavedFiltersManager } from "./SavedFiltersManager";
import { DealFilters } from "@/types/filters";
import { Filter, Search, X } from "lucide-react";

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
  onRefresh: () => void;
}

export const DealsFilterPanel = ({
  filters,
  onFiltersChange,
  uniqueValues,
  onRefresh,
}: DealsFilterPanelProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || "");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange({ ...filters, searchTerm: value });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    onFiltersChange({ ...filters, searchTerm: "" });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.stages?.length) count++;
    if (filters.leadOwners?.length) count++;
    if (filters.customers?.length) count++;
    if (filters.priorities?.length) count++;
    if (filters.regions?.length) count++;
    if (filters.currencies?.length) count++;
    if (filters.projectNames?.length) count++;
    if (filters.leadNames?.length) count++;
    if (filters.businessValues?.length) count++;
    if (filters.decisionMakerLevels?.length) count++;
    if (filters.rfqStatuses?.length) count++;
    if (filters.handoffStatuses?.length) count++;
    if (filters.relationshipStrengths?.length) count++;
    if (filters.customerChallenges?.length) count++;
    if (filters.expectedCloseDateFrom || filters.expectedCloseDateTo) count++;
    if (filters.totalContractValueMin !== undefined || filters.totalContractValueMax !== undefined) count++;
    if (filters.createdDateFrom || filters.createdDateTo) count++;
    if (filters.modifiedDateFrom || filters.modifiedDateTo) count++;
    return count;
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    onFiltersChange({});
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-3">
      {/* Top bar with search input on left and filters button on right */}
      <div className="flex items-center justify-between gap-4">
        {/* Search input on the left */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10 h-9"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters button on the right */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-9 px-3"
          >
            <Filter className="w-4 h-4 mr-2" />
            Search Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Expandable filters section */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Advanced Filters</h3>
            <div className="flex items-center gap-2">
              <SavedFiltersManager
                currentFilters={filters}
                onLoadFilters={onFiltersChange}
              />
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>
          
          <FilterFieldSelector
            filters={filters}
            onFiltersChange={onFiltersChange}
            uniqueValues={uniqueValues}
          />
        </div>
      )}
    </div>
  );
};

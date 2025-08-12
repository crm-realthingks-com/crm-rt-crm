
import { useMemo } from 'react';
import { Deal } from '@/types/deal';
import { DealFilters } from '@/types/filters';

export const useFilteredDeals = (deals: Deal[], filters: DealFilters) => {
  const filteredDeals = useMemo(() => {
    if (!filters || Object.keys(filters).length === 0) {
      return deals;
    }

    return deals.filter(deal => {
      // Search term filter
      if (filters.searchTerm) {
        const searchValue = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          deal.project_name?.toLowerCase().includes(searchValue) ||
          deal.customer_name?.toLowerCase().includes(searchValue) ||
          deal.lead_name?.toLowerCase().includes(searchValue) ||
          deal.lead_owner?.toLowerCase().includes(searchValue) ||
          deal.stage?.toLowerCase().includes(searchValue) ||
          deal.deal_name?.toLowerCase().includes(searchValue);
        
        if (!matchesSearch) return false;
      }

      // Stage filter
      if (filters.stages?.length && !filters.stages.includes(deal.stage)) {
        return false;
      }

      // Lead Owner filter
      if (filters.leadOwners?.length && !filters.leadOwners.includes(deal.lead_owner || '')) {
        return false;
      }

      // Customer filter
      if (filters.customers?.length && !filters.customers.includes(deal.customer_name || '')) {
        return false;
      }

      // Expected Close Date range
      if (filters.expectedCloseDateFrom || filters.expectedCloseDateTo) {
        const closeDate = deal.expected_closing_date;
        if (!closeDate) return false;
        
        const closeDateObj = new Date(closeDate);
        if (filters.expectedCloseDateFrom && closeDateObj < new Date(filters.expectedCloseDateFrom)) {
          return false;
        }
        if (filters.expectedCloseDateTo && closeDateObj > new Date(filters.expectedCloseDateTo)) {
          return false;
        }
      }

      // Priority filter
      if (filters.priorities?.length && !filters.priorities.includes(deal.priority || 0)) {
        return false;
      }

      // Contract Value range
      if (filters.totalContractValueMin !== undefined || filters.totalContractValueMax !== undefined) {
        const value = deal.total_contract_value || 0;
        if (filters.totalContractValueMin !== undefined && value < filters.totalContractValueMin) {
          return false;
        }
        if (filters.totalContractValueMax !== undefined && value > filters.totalContractValueMax) {
          return false;
        }
      }

      // Region filter
      if (filters.regions?.length && !filters.regions.includes(deal.region || '')) {
        return false;
      }

      // Currency filter
      if (filters.currencies?.length && !filters.currencies.includes(deal.currency_type || '')) {
        return false;
      }

      // Project Name filter
      if (filters.projectNames?.length && !filters.projectNames.includes(deal.project_name || '')) {
        return false;
      }

      // Lead Name filter
      if (filters.leadNames?.length && !filters.leadNames.includes(deal.lead_name || '')) {
        return false;
      }

      // Business Value filter
      if (filters.businessValues?.length && !filters.businessValues.includes(deal.business_value || '')) {
        return false;
      }

      // Decision Maker Level filter
      if (filters.decisionMakerLevels?.length && !filters.decisionMakerLevels.includes(deal.decision_maker_level || '')) {
        return false;
      }

      // RFQ Status filter
      if (filters.rfqStatuses?.length && !filters.rfqStatuses.includes(deal.rfq_status || '')) {
        return false;
      }

      // Handoff Status filter
      if (filters.handoffStatuses?.length && !filters.handoffStatuses.includes(deal.handoff_status || '')) {
        return false;
      }

      // Is Recurring filter
      if (filters.isRecurring?.length && !filters.isRecurring.includes(deal.is_recurring || '')) {
        return false;
      }

      // Relationship Strength filter
      if (filters.relationshipStrengths?.length && !filters.relationshipStrengths.includes(deal.relationship_strength || '')) {
        return false;
      }

      // Customer Challenges filter
      if (filters.customerChallenges?.length && !filters.customerChallenges.includes(deal.customer_challenges || '')) {
        return false;
      }

      // Created Date range
      if (filters.createdDateFrom || filters.createdDateTo) {
        const createdDate = deal.created_at;
        if (!createdDate) return false;
        
        const createdDateObj = new Date(createdDate);
        if (filters.createdDateFrom && createdDateObj < new Date(filters.createdDateFrom)) {
          return false;
        }
        if (filters.createdDateTo && createdDateObj > new Date(filters.createdDateTo)) {
          return false;
        }
      }

      // Modified Date range
      if (filters.modifiedDateFrom || filters.modifiedDateTo) {
        const modifiedDate = deal.modified_at;
        if (!modifiedDate) return false;
        
        const modifiedDateObj = new Date(modifiedDate);
        if (filters.modifiedDateFrom && modifiedDateObj < new Date(filters.modifiedDateFrom)) {
          return false;
        }
        if (filters.modifiedDateTo && modifiedDateObj > new Date(filters.modifiedDateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [deals, filters]);

  // Get unique values for filter options
  const uniqueValues = useMemo(() => {
    const unique = {
      leadOwners: [...new Set(deals.map(d => d.lead_owner).filter(Boolean))],
      customers: [...new Set(deals.map(d => d.customer_name).filter(Boolean))],
      regions: [...new Set(deals.map(d => d.region).filter(Boolean))],
      currencies: [...new Set(deals.map(d => d.currency_type).filter(Boolean))],
      projectNames: [...new Set(deals.map(d => d.project_name).filter(Boolean))],
      leadNames: [...new Set(deals.map(d => d.lead_name).filter(Boolean))],
      budgets: [...new Set(deals.map(d => d.budget).filter(Boolean))],
      businessValues: [...new Set(deals.map(d => d.business_value).filter(Boolean))],
      decisionMakerLevels: [...new Set(deals.map(d => d.decision_maker_level).filter(Boolean))],
      rfqStatuses: [...new Set(deals.map(d => d.rfq_status).filter(Boolean))],
      handoffStatuses: [...new Set(deals.map(d => d.handoff_status).filter(Boolean))],
      relationshipStrengths: [...new Set(deals.map(d => d.relationship_strength).filter(Boolean))],
      customerChallenges: [...new Set(deals.map(d => d.customer_challenges).filter(Boolean))],
    };

    // Sort all arrays
    Object.keys(unique).forEach(key => {
      unique[key as keyof typeof unique].sort();
    });

    return unique;
  }, [deals]);

  return { filteredDeals, uniqueValues };
};

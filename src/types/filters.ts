
import { DealStage } from './deal';

export interface DealFilters {
  searchTerm?: string;
  stages?: DealStage[];
  leadOwners?: string[];
  customers?: string[];
  expectedCloseDateFrom?: string;
  expectedCloseDateTo?: string;
  priorities?: number[];
  totalContractValueMin?: number;
  totalContractValueMax?: number;
  regions?: string[];
  probabilities?: number[];
  currencies?: string[];
  projectNames?: string[];
  leadNames?: string[];
  budgets?: string[];
  businessValues?: string[];
  decisionMakerLevels?: string[];
  rfqStatuses?: string[];
  handoffStatuses?: string[];
  isRecurring?: string[];
  relationshipStrengths?: string[];
  customerChallenges?: string[];
  createdDateFrom?: string;
  createdDateTo?: string;
  modifiedDateFrom?: string;
  modifiedDateTo?: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'multiselect';
}

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  filters: DealFilters;
  created_at: string;
  updated_at: string;
}

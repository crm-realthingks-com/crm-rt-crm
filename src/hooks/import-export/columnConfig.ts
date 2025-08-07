
interface ColumnDefinition {
  required: string[];
  optional: string[];
  allowedColumns: string[];
  dateFields: string[];
  numericFields: string[];
  booleanFields: string[];
}

interface ColumnConfigs {
  [tableName: string]: ColumnDefinition;
}

export const columnConfigs: ColumnConfigs = {
  deals: {
    required: ['deal_name', 'stage'],
    optional: [
      'id', 'project_name', 'customer_name', 'lead_name', 'lead_owner', 'region',
      'priority', 'probability', 'total_contract_value', 'expected_closing_date',
      'internal_comment', 'customer_need', 'customer_challenges', 'relationship_strength',
      'budget', 'business_value', 'decision_maker_level', 'is_recurring',
      'project_duration', 'start_date', 'end_date', 'rfq_received_date',
      'proposal_due_date', 'rfq_status', 'currency_type', 'action_items',
      'current_status', 'closing', 'won_reason', 'lost_reason', 'need_improvement',
      'drop_reason', 'created_at', 'modified_at'
    ],
    get allowedColumns() {
      return [...this.required, ...this.optional];
    },
    dateFields: [
      'expected_closing_date', 'start_date', 'end_date', 'rfq_received_date',
      'proposal_due_date', 'created_at', 'modified_at'
    ],
    numericFields: ['priority', 'probability', 'total_contract_value', 'project_duration'],
    booleanFields: []
  },
  contacts: {
    required: ['contact_name'],
    optional: [
      'id', 'company_name', 'position', 'email', 'phone_no', 'mobile_no',
      'linkedin', 'website', 'contact_source', 'lead_status', 'industry',
      'city', 'state', 'country', 'description', 'annual_revenue', 'no_of_employees'
    ],
    get allowedColumns() {
      return [...this.required, ...this.optional];
    },
    dateFields: ['created_time', 'modified_time'],
    numericFields: ['annual_revenue', 'no_of_employees'],
    booleanFields: []
  },
  contacts_module: {
    required: ['contact_name'],
    optional: [
      'id', 'company_name', 'position', 'email', 'phone_no', 'mobile_no',
      'linkedin', 'website', 'contact_source', 'lead_status', 'industry',
      'city', 'state', 'country', 'description', 'annual_revenue', 'no_of_employees'
    ],
    get allowedColumns() {
      return [...this.required, ...this.optional];
    },
    dateFields: ['created_time', 'modified_time'],
    numericFields: ['annual_revenue', 'no_of_employees'],
    booleanFields: []
  },
  leads: {
    required: ['lead_name'],
    optional: [
      'id', 'company_name', 'position', 'email', 'phone_no', 'mobile_no',
      'linkedin', 'website', 'contact_source', 'lead_status', 'industry',
      'city', 'country', 'description'
    ],
    get allowedColumns() {
      return [...this.required, ...this.optional];
    },
    dateFields: ['created_time', 'modified_time'],
    numericFields: [],
    booleanFields: []
  }
};

export const getColumnConfig = (tableName: string): ColumnDefinition => {
  return columnConfigs[tableName] || {
    required: [],
    optional: [],
    allowedColumns: [],
    dateFields: [],
    numericFields: [],
    booleanFields: []
  };
};

export const getAllColumns = (tableName: string): string[] => {
  const config = getColumnConfig(tableName);
  return config.allowedColumns;
};

export const getRequiredColumns = (tableName: string): string[] => {
  const config = getColumnConfig(tableName);
  return config.required;
};

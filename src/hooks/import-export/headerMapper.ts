
interface HeaderMapping {
  [key: string]: string;
}

const commonMappings: HeaderMapping = {
  // Deal field mappings
  'deal name': 'deal_name',
  'project name': 'project_name',
  'customer name': 'customer_name',
  'lead name': 'lead_name',
  'lead owner': 'lead_owner',
  'stage': 'stage',
  'priority': 'priority',
  'probability': 'probability',
  'total contract value': 'total_contract_value',
  'contract value': 'total_contract_value',
  'value': 'total_contract_value',
  'expected closing date': 'expected_closing_date',
  'closing date': 'expected_closing_date',
  'region': 'region',
  'comment': 'internal_comment',
  'internal comment': 'internal_comment',
  'customer need': 'customer_need',
  'customer challenges': 'customer_challenges',
  'relationship strength': 'relationship_strength',
  'budget': 'budget',
  'business value': 'business_value',
  'decision maker level': 'decision_maker_level',
  'recurring': 'is_recurring',
  'is recurring': 'is_recurring',
  'duration': 'project_duration',
  'project duration': 'project_duration',
  'start date': 'start_date',
  'end date': 'end_date',
  'rfq received': 'rfq_received_date',
  'rfq received date': 'rfq_received_date',
  'proposal due': 'proposal_due_date',
  'proposal due date': 'proposal_due_date',
  'rfq status': 'rfq_status',
  'currency': 'currency_type',
  'currency type': 'currency_type',
  'action items': 'action_items',
  'current status': 'current_status',
  'status': 'current_status',
  'closing': 'closing',
  'won reason': 'won_reason',
  'lost reason': 'lost_reason',
  'need improvement': 'need_improvement',
  'drop reason': 'drop_reason',
  'created': 'created_at',
  'created at': 'created_at',
  'updated': 'modified_at',
  'modified at': 'modified_at',
  
  // Contact field mappings
  'contact name': 'contact_name',
  'name': 'contact_name',
  'company': 'company_name',
  'company name': 'company_name',
  'position': 'position',
  'title': 'position',
  'job title': 'position',
  'email': 'email',
  'phone': 'phone_no',
  'phone number': 'phone_no',
  'mobile': 'mobile_no',
  'mobile number': 'mobile_no',
  'linkedin': 'linkedin',
  'website': 'website',
  'source': 'contact_source',
  'contact source': 'contact_source',
  'lead source': 'contact_source',
  'lead status': 'lead_status',
  'industry': 'industry',
  'city': 'city',
  'state': 'state',
  'country': 'country',
  'description': 'description',
  'annual revenue': 'annual_revenue',
  'revenue': 'annual_revenue',
  'employees': 'no_of_employees',
  'number of employees': 'no_of_employees',
  'no of employees': 'no_of_employees',
  'contact owner': 'contact_owner',
  'owner': 'contact_owner',
};

export const mapHeaders = (headers: string[]): string[] => {
  return headers.map(header => {
    const normalizedHeader = header.toLowerCase().trim();
    return commonMappings[normalizedHeader] || header;
  });
};

export const createHeaderMapper = (tableName: string) => {
  return (header: string): string | null => {
    const normalizedHeader = header.toLowerCase().trim();
    return commonMappings[normalizedHeader] || null;
  };
};

export const createFieldMapping = (csvHeaders: string[], tableName: string): HeaderMapping => {
  const mapping: HeaderMapping = {};
  
  csvHeaders.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    const mappedField = commonMappings[normalizedHeader];
    
    if (mappedField) {
      mapping[header] = mappedField;
    } else {
      // If no mapping found, try to use the header as-is if it looks like a database field
      const cleanHeader = header.toLowerCase().replace(/\s+/g, '_');
      mapping[header] = cleanHeader;
    }
  });
  
  return mapping;
};

export const getSuggestedMapping = (csvHeader: string, tableName: string): string => {
  const normalizedHeader = csvHeader.toLowerCase().trim();
  return commonMappings[normalizedHeader] || csvHeader.toLowerCase().replace(/\s+/g, '_');
};

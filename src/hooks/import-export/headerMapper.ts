
import { getColumnConfig } from './columnConfig';

export const mapHeaders = (row: Record<string, any>, config: any): Record<string, any> => {
  const mapper = createHeaderMapper(config.table || 'contacts');
  const mappedRow: Record<string, any> = {};
  
  for (const [header, value] of Object.entries(row)) {
    const mappedField = mapper(header);
    if (mappedField) {
      mappedRow[mappedField] = value;
    }
  }
  
  return mappedRow;
};

export const createHeaderMapper = (tableName: string) => {
  const config = getColumnConfig(tableName);

  return (header: string): string | null => {
    const trimmedHeader = header.trim();
    
    console.log(`Mapping header: "${trimmedHeader}"`);
    
    // For deals, create comprehensive field mappings
    if (tableName === 'deals') {
      // Direct field matches first (case-insensitive)
      const directMatch = config.allowedColumns.find(col => 
        col.toLowerCase() === trimmedHeader.toLowerCase()
      );
      if (directMatch) {
        console.log(`Direct field match found: ${trimmedHeader} -> ${directMatch}`);
        return directMatch;
      }
      
      // Comprehensive field mappings for deals (case-insensitive)
      const dealMappings: Record<string, string> = {
        // System fields
        'id': 'id',
        'deal id': 'id',
        'deal_id': 'id',
        'created_at': 'created_at',
        'updated_at': 'updated_at',
        
        // Core deal fields
        'deal_name': 'deal_name',
        'deal name': 'deal_name',
        'dealname': 'deal_name',
        'name': 'deal_name',
        'project_name': 'project_name',
        'project name': 'project_name',
        'project': 'project_name',
        'stage': 'stage',
        'deal stage': 'stage',
        'status': 'stage',
        'customer_name': 'customer_name',
        'customer name': 'customer_name',
        'customer': 'customer_name',
        'client': 'customer_name',
        'company': 'customer_name',
        'lead_name': 'lead_name',
        'lead name': 'lead_name',
        'lead': 'lead_name',
        'contact': 'lead_name',
        'lead_owner': 'lead_owner',
        'lead owner': 'lead_owner',
        'owner': 'lead_owner',
        'account owner': 'lead_owner',
        'sales owner': 'lead_owner',
        'assigned to': 'lead_owner',
        'region': 'region',
        'territory': 'region',
        'area': 'region',
        'priority': 'priority',
        'deal priority': 'priority',
        'internal_comment': 'internal_comment',
        'internal comment': 'internal_comment',
        'notes': 'internal_comment',
        'comments': 'internal_comment',
        
        // Additional mappings for other deal fields
        'budget': 'budget',
        'deal budget': 'budget',
        'estimated budget': 'budget',
        'probability': 'probability',
        'win probability': 'probability',
        'chance': 'probability',
        'likelihood': 'probability',
        'expected_closing_date': 'expected_closing_date',
        'expected closing date': 'expected_closing_date',
        'closing date': 'expected_closing_date',
        'close date': 'expected_closing_date',
        'expected close': 'expected_closing_date',
        'due date': 'expected_closing_date',
      };
      
      // Check for mapping (case-insensitive)
      const lowerHeader = trimmedHeader.toLowerCase();
      for (const [key, value] of Object.entries(dealMappings)) {
        if (key.toLowerCase() === lowerHeader) {
          console.log(`Deal mapping found: ${trimmedHeader} -> ${value}`);
          return value;
        }
      }
      
      console.log(`No mapping found for deals field: ${trimmedHeader}`);
      return null;
    }
    
    // For other tables, use normalized matching with case-insensitive search
    const normalized = trimmedHeader.toLowerCase().replace(/[\s_-]+/g, '_');
    
    // Direct match first (case-insensitive)
    const directMatch = config.allowedColumns.find(col => 
      col.toLowerCase() === normalized || col.toLowerCase() === trimmedHeader.toLowerCase()
    );
    if (directMatch) {
      console.log(`Direct match found: ${trimmedHeader} -> ${directMatch}`);
      return directMatch;
    }
    
    // Generic mappings for other tables (case-insensitive)
    const mappings: Record<string, string> = {
      'name': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'full_name': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'contact': tableName === 'leads' ? 'lead_name' : 'contact_name',
      'company': 'company_name',
      'organization': 'company_name',
      'job_title': 'position',
      'title': tableName === 'meetings' ? 'title' : 'position',
      'phone': 'phone_no',
      'telephone': 'phone_no',
      'mobile': 'mobile_no',
      'cell': 'mobile_no',
      'employees': 'no_of_employees',
      'revenue': 'annual_revenue',
      'source': 'contact_source',
      'status': tableName === 'meetings' ? 'status' : 'lead_status',
      'lead': 'lead_status'
    };
    
    const lowerHeader = trimmedHeader.toLowerCase();
    for (const [key, value] of Object.entries(mappings)) {
      if (key === lowerHeader || key.replace(/[\s_-]+/g, '_') === normalized) {
        console.log(`Generic mapping found: ${trimmedHeader} -> ${value}`);
        return value;
      }
    }
    
    console.log(`No mapping found for: ${trimmedHeader}`);
    return null;
  };
};

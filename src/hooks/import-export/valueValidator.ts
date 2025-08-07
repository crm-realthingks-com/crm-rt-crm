
export const validateValue = (value: any, fieldName: string, tableName: string): any => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const stringValue = String(value).trim();
  if (stringValue === '') {
    return null;
  }

  // Handle specific field validations based on table and field
  if (tableName === 'deals') {
    switch (fieldName) {
      case 'stage':
        const validStages = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
        return validStages.includes(stringValue) ? stringValue : 'Lead';
      
      case 'priority':
        const priority = parseInt(stringValue);
        return isNaN(priority) ? null : Math.max(1, Math.min(5, priority));
      
      case 'probability':
        const probability = parseInt(stringValue);
        return isNaN(probability) ? null : Math.max(0, Math.min(100, probability));
      
      case 'total_contract_value':
      case 'project_duration':
        const numValue = parseFloat(stringValue);
        return isNaN(numValue) ? null : numValue;
      
      case 'expected_closing_date':
      case 'start_date':
      case 'end_date':
      case 'rfq_received_date':
      case 'proposal_due_date':
        // Handle date fields - try to parse the date
        const date = new Date(stringValue);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      
      case 'is_recurring':
        return stringValue.toLowerCase() === 'true' || stringValue === '1';
      
      default:
        return stringValue;
    }
  }

  if (tableName === 'contacts') {
    switch (fieldName) {
      case 'annual_revenue':
      case 'no_of_employees':
        const numValue = parseFloat(stringValue);
        return isNaN(numValue) ? null : numValue;
      
      default:
        return stringValue;
    }
  }

  if (tableName === 'leads') {
    // For leads, most fields are text
    return stringValue;
  }

  // Default: return the string value
  return stringValue;
};

export const formatValueForImport = (value: any, fieldName: string, tableName: string): any => {
  const validatedValue = validateValue(value, fieldName, tableName);
  
  if (validatedValue === null || validatedValue === undefined) {
    return null;
  }

  // Ensure boolean fields are properly formatted
  if (typeof validatedValue === 'boolean') {
    return validatedValue;
  }

  return validatedValue;
};

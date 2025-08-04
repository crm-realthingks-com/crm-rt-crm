
import { getColumnConfig } from './columnConfig';

export const validateRecord = (record: any, tableName: string): { isValid: boolean; errors: string[] } => {
  console.log('Validating import record:', record);
  
  const config = getColumnConfig(tableName);
  const errors: string[] = [];
  
  if (tableName === 'deals') {
    // Check if we have the basic required fields
    const hasValidDealName = record.deal_name && typeof record.deal_name === 'string' && record.deal_name.trim() !== '';
    const validStages = ['Lead', 'Discussions', 'Qualified', 'RFQ', 'Offered', 'Won', 'Lost', 'Dropped'];
    const hasValidStage = record.stage && validStages.includes(record.stage);
    
    console.log(`Import validation - deal_name: "${record.deal_name}", stage: "${record.stage}"`);
    console.log(`Validation results - hasValidDealName: ${hasValidDealName}, hasValidStage: ${hasValidStage}`);
    
    if (!hasValidDealName) {
      errors.push('Invalid deal: missing or empty deal_name');
    }
    
    if (!hasValidStage) {
      errors.push(`Invalid deal: invalid stage "${record.stage}". Valid stages: ${validStages.join(', ')}`);
    }
    
    // Additional validation for critical fields (but allow them to be empty for updates)
    if (record.probability !== undefined && record.probability !== null && record.probability !== '') {
      const prob = parseInt(String(record.probability));
      if (isNaN(prob) || prob < 0 || prob > 100) {
        errors.push(`Invalid probability: ${record.probability}. Must be between 0-100`);
      }
    }
    
    if (record.priority !== undefined && record.priority !== null && record.priority !== '') {
      const priority = parseInt(String(record.priority));
      if (isNaN(priority) || priority < 1 || priority > 5) {
        errors.push(`Invalid priority: ${record.priority}. Must be between 1-5`);
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  // For other tables, use the existing logic but be more lenient
  const missingRequired = config.required.filter(field => {
    const value = record[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
  
  if (missingRequired.length > 0) {
    errors.push(`Missing required fields for ${tableName}: ${missingRequired.join(', ')}`);
  }
  
  return { isValid: errors.length === 0, errors };
};

export const createRecordValidator = (tableName: string) => {
  return (record: any): boolean => {
    const result = validateRecord(record, tableName);
    return result.isValid;
  };
};

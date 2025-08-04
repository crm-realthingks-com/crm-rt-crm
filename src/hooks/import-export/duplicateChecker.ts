import { supabase } from "@/integrations/supabase/client";

interface DuplicateRecord<T> {
  importRecord: T;
  existingRecord: any;
  matchedFields: string[];
}

interface DuplicateCheckResult<T> {
  duplicates: DuplicateRecord<T>[];
  unique: T[];
  totalProcessed: number;
}

export const findDuplicateRecords = async <T extends Record<string, any>>(
  records: T[],
  tableName: string,
  keyFields: string[]
): Promise<DuplicateCheckResult<T>> => {
  try {
    let existingRecords: any[] = [];

    // Fetch existing records based on table name
    if (tableName === 'deals') {
      const { data } = await supabase
        .from('deals')
        .select('*');
      existingRecords = data || [];
    } else if (tableName === 'contacts') {
      const { data } = await supabase
        .from('contacts')
        .select('*');
      existingRecords = data || [];
    } else if (tableName === 'leads') {
      const { data } = await supabase
        .from('leads')
        .select('*');
      existingRecords = data || [];
    }

    const duplicates: DuplicateRecord<T>[] = [];
    const unique: T[] = [];

    for (const record of records) {
      const isDuplicate = existingRecords.some(existing => {
        return keyFields.some(field => {
          // Handle different field mappings
          const recordValue = getFieldValue(record, field, tableName);
          const existingValue = getFieldValue(existing, field, tableName);
          
          return recordValue && existingValue && 
                 recordValue.toString().toLowerCase() === existingValue.toString().toLowerCase();
        });
      });

      if (isDuplicate) {
        const matchingRecord = existingRecords.find(existing => {
          return keyFields.some(field => {
            const recordValue = getFieldValue(record, field, tableName);
            const existingValue = getFieldValue(existing, field, tableName);
            return recordValue && existingValue && 
                   recordValue.toString().toLowerCase() === existingValue.toString().toLowerCase();
          });
        });

        duplicates.push({
          importRecord: record,
          existingRecord: matchingRecord,
          matchedFields: keyFields.filter(field => {
            const recordValue = getFieldValue(record, field, tableName);
            const existingValue = getFieldValue(matchingRecord, field, tableName);
            return recordValue && existingValue && 
                   recordValue.toString().toLowerCase() === existingValue.toString().toLowerCase();
          })
        });
      } else {
        unique.push(record);
      }
    }

    return {
      duplicates,
      unique,
      totalProcessed: records.length
    };
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    throw new Error('Failed to check for duplicate records');
  }
};

const getFieldValue = (record: any, field: string, tableName: string): any => {
  // Handle field mapping based on table
  if (tableName === 'deals') {
    switch (field) {
      case 'deal_name':
        return record.deal_name || record.project_name;
      case 'company_name':
        return record.company_name || record.customer_name;
      default:
        return record[field];
    }
  } else if (tableName === 'contacts') {
    switch (field) {
      case 'contact_name':
        return record.contact_name || record.lead_name;
      case 'company':
        return record.company || record.company_name;
      default:
        return record[field];
    }
  } else if (tableName === 'leads') {
    switch (field) {
      case 'lead_name':
        return record.lead_name;
      case 'company_name':
        return record.company_name;
      default:
        return record[field];
    }
  }
  
  return record[field];
};

export const generateImportTemplate = (fields: string[], tableName: string): string => {
  let csvHeader = fields.map(field => {
    if (tableName === 'deals') {
      switch (field) {
        case 'deal_name':
          return 'Deal Name (or Project Name)';
        case 'company_name':
          return 'Company Name (or Customer Name)';
        default:
          return field;
      }
    } else if (tableName === 'contacts') {
      switch (field) {
        case 'contact_name':
          return 'Contact Name (or Lead Name)';
        case 'company':
          return 'Company (or Company Name)';
        default:
          return field;
      }
    }
    return field;
  }).join(',');
  
  return csvHeader + '\n';
};

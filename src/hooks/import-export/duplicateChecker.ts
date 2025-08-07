
export const createDuplicateChecker = (tableName: string) => {
  return (record: any, existingRecords: any[]): boolean => {
    if (!existingRecords || existingRecords.length === 0) {
      return false;
    }

    if (tableName === 'deals') {
      // Check for duplicates based on deal_name or project_name
      return existingRecords.some(existing => {
        const recordName = record.deal_name || record.project_name;
        const existingName = existing.deal_name || existing.project_name;
        
        if (recordName && existingName) {
          return recordName.toLowerCase().trim() === existingName.toLowerCase().trim();
        }
        return false;
      });
    }

    if (tableName === 'contacts') {
      // Check for duplicates based on contact_name and company_name combination
      return existingRecords.some(existing => {
        const nameMatch = record.contact_name && existing.contact_name &&
          record.contact_name.toLowerCase().trim() === existing.contact_name.toLowerCase().trim();
        
        const companyMatch = record.company_name && existing.company_name &&
          record.company_name.toLowerCase().trim() === existing.company_name.toLowerCase().trim();
        
        // Consider it a duplicate if both name and company match, or if name matches and no company info
        return nameMatch && (companyMatch || (!record.company_name && !existing.company_name));
      });
    }

    if (tableName === 'leads') {
      // Check for duplicates based on lead_name and company_name combination
      return existingRecords.some(existing => {
        const nameMatch = record.lead_name && existing.lead_name &&
          record.lead_name.toLowerCase().trim() === existing.lead_name.toLowerCase().trim();
        
        const companyMatch = record.company_name && existing.company_name &&
          record.company_name.toLowerCase().trim() === existing.company_name.toLowerCase().trim();
        
        return nameMatch && (companyMatch || (!record.company_name && !existing.company_name));
      });
    }

    // Default: no duplicate detection for unknown tables
    return false;
  };
};

export const getUniqueIdentifier = (record: any, tableName: string): string => {
  if (tableName === 'deals') {
    return record.deal_name || record.project_name || 'unknown';
  }
  
  if (tableName === 'contacts') {
    return `${record.contact_name || 'unknown'}-${record.company_name || 'no-company'}`;
  }
  
  if (tableName === 'leads') {
    return `${record.lead_name || 'unknown'}-${record.company_name || 'no-company'}`;
  }
  
  return record.id || 'unknown';
};

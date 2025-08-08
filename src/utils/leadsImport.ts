
import { supabase } from '@/integrations/supabase/client';

export interface LeadsImportResult {
  success: number;
  duplicates: number;
  errors: number;
  messages: string[];
  errorDetails: any[];
}

export interface LeadImportRow {
  'Lead Name': string;
  'Company Name': string;
  'Position': string;
  'Email': string;
  'Phone Number': string;
  'LinkedIn': string;
  'Website': string;
  'Lead Source': string;
  'Industry': string;
  'Region': string;
  'Status': string;
  'Description': string;
  'Lead Owner': string;
}

// Expected headers in exact order matching export
const EXPECTED_HEADERS = [
  'Lead Name',
  'Company Name', 
  'Position',
  'Email',
  'Phone Number',
  'LinkedIn',
  'Website',
  'Lead Source',
  'Industry',
  'Region',
  'Status',
  'Description',
  'Lead Owner'
];

// Valid dropdown values
const VALID_SOURCES = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Partner', 'Advertisement', 'Other'];
const VALID_INDUSTRIES = ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Other'];
const VALID_REGIONS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Australia', 'Other'];
const VALID_STATUSES = ['New', 'Contacted', 'Qualified'];

export class LeadsImporter {
  private users: any[] = [];
  private currentUserId: string;

  constructor(users: any[], currentUserId: string) {
    this.users = users || [];
    this.currentUserId = currentUserId;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result.map(field => field.replace(/^"|"$/g, ''));
  }

  private normalizeHeaderName(header: string): string {
    return header.trim().replace(/\s+/g, ' ');
  }

  private mapHeaders(csvHeaders: string[]): { mapping: Record<number, string>; warnings: string[] } {
    const mapping: Record<number, string> = {};
    const warnings: string[] = [];
    const normalizedHeaders = csvHeaders.map(h => this.normalizeHeaderName(h));

    // Try exact matches first
    normalizedHeaders.forEach((header, index) => {
      const exactMatch = EXPECTED_HEADERS.find(expected => expected === header);
      if (exactMatch) {
        mapping[index] = exactMatch;
        return;
      }

      // Try case-insensitive matches
      const caseInsensitiveMatch = EXPECTED_HEADERS.find(expected => 
        expected.toLowerCase() === header.toLowerCase()
      );
      if (caseInsensitiveMatch) {
        mapping[index] = caseInsensitiveMatch;
        return;
      }

      // Try partial matches for common variations
      const partialMatches: Record<string, string> = {
        'name': 'Lead Name',
        'lead': 'Lead Name',
        'company': 'Company Name',
        'title': 'Position',
        'job title': 'Position',
        'phone': 'Phone Number',
        'mobile': 'Phone Number',
        'source': 'Lead Source',
        'lead source': 'Lead Source',
        'contact source': 'Lead Source',
        'country': 'Region',
        'location': 'Region',
        'lead status': 'Status',
        'notes': 'Description',
        'comments': 'Description',
        'owner': 'Lead Owner',
        'assigned to': 'Lead Owner'
      };

      const lowerHeader = header.toLowerCase();
      const partialMatch = Object.entries(partialMatches).find(([key]) => 
        lowerHeader.includes(key)
      );
      
      if (partialMatch) {
        mapping[index] = partialMatch[1];
        warnings.push(`Mapped "${header}" to "${partialMatch[1]}"`);
      } else {
        warnings.push(`Unknown column "${header}" will be ignored`);
      }
    });

    return { mapping, warnings };
  }

  private validateDropdownValue(value: string, validValues: string[], fieldName: string): string {
    if (!value || value.trim() === '') return '';
    
    const trimmedValue = value.trim();
    const matchedValue = validValues.find(v => v.toLowerCase() === trimmedValue.toLowerCase());
    
    if (matchedValue) {
      return matchedValue;
    }
    
    console.warn(`Invalid ${fieldName}: "${trimmedValue}". Valid values: ${validValues.join(', ')}`);
    return '';
  }

  private resolveOwnerId(ownerValue?: string): string {
    const fallback = this.currentUserId;
    const v = (ownerValue || '').trim();
    if (!v) return fallback;
    
    // Check if it's already a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(v)) return v;
    
    // Try to find user by display name, full name, or email
    const found = this.users.find(u => (
      (u.display_name && u.display_name.toLowerCase() === v.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase() === v.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === v.toLowerCase())
    ));
    
    return found?.id || fallback;
  }

  private async checkDuplicate(leadName: string, companyName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .eq('lead_name', leadName)
        .eq('company_name', companyName || '')
        .limit(1);

      if (error) {
        console.error('Error checking duplicates:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Duplicate check error:', error);
      return false;
    }
  }

  private processRowData(rowData: Record<string, string>): any {
    const leadName = (rowData['Lead Name'] || '').trim();
    const companyName = (rowData['Company Name'] || '').trim();
    
    return {
      lead_name: leadName,
      company_name: companyName,
      position: (rowData['Position'] || '').trim() || null,
      email: (rowData['Email'] || '').trim() || null,
      phone_no: (rowData['Phone Number'] || '').trim() || null,
      linkedin: (rowData['LinkedIn'] || '').trim() || null,
      website: (rowData['Website'] || '').trim() || null,
      contact_source: this.validateDropdownValue(
        rowData['Lead Source'] || '', 
        VALID_SOURCES, 
        'Lead Source'
      ) || null,
      industry: this.validateDropdownValue(
        rowData['Industry'] || '', 
        VALID_INDUSTRIES, 
        'Industry'
      ) || null,
      country: this.validateDropdownValue(
        rowData['Region'] || '', 
        VALID_REGIONS, 
        'Region'
      ) || null,
      status: this.validateDropdownValue(
        rowData['Status'] || 'New', 
        VALID_STATUSES, 
        'Status'
      ) || 'New',
      description: (rowData['Description'] || '').trim() || null,
      created_by: this.currentUserId,
      modified_by: this.currentUserId,
      contact_owner: this.resolveOwnerId(rowData['Lead Owner'])
    };
  }

  async importFromFile(file: File): Promise<LeadsImportResult> {
    console.log('=== LEADS IMPORT START ===');
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    try {
      // Read file content
      const text = await file.text();
      console.log('File content length:', text.length);
      
      if (!text.trim()) {
        throw new Error('File is empty');
      }

      // Parse CSV lines
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
      console.log('Total lines after filtering:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
      }

      // Parse headers
      const csvHeaders = this.parseCSVLine(lines[0]);
      console.log('CSV headers found:', csvHeaders);

      // Map headers to expected format
      const { mapping, warnings } = this.mapHeaders(csvHeaders);
      console.log('Header mapping:', mapping);
      
      if (warnings.length > 0) {
        console.log('Header mapping warnings:', warnings);
      }

      // Check for required fields
      const mappedHeaders = Object.values(mapping);
      const hasLeadName = mappedHeaders.includes('Lead Name');
      const hasCompanyName = mappedHeaders.includes('Company Name');

      if (!hasLeadName) {
        throw new Error('Required field "Lead Name" not found in CSV headers');
      }
      if (!hasCompanyName) {
        throw new Error('Required field "Company Name" not found in CSV headers');
      }

      // Parse data rows
      const csvData = [];
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          const rowData: Record<string, string> = {};
          
          // Map values using header mapping
          Object.entries(mapping).forEach(([index, fieldName]) => {
            const value = values[parseInt(index)] || '';
            rowData[fieldName] = value.trim();
          });
          
          csvData.push(rowData);
        } catch (parseError) {
          console.error(`Error parsing line ${i + 1}:`, parseError);
          // Skip malformed lines but continue processing
        }
      }

      console.log('Parsed CSV data rows:', csvData.length);

      // Process each row
      let success = 0;
      let duplicates = 0;
      let errors = 0;
      const messages: string[] = [];
      const errorDetails: any[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const rowData = csvData[i];
        const rowNumber = i + 2; // +2 because we start from line 1 and skip header
        
        try {
          console.log(`Processing row ${rowNumber}:`, rowData);

          // Validate required fields
          const leadName = (rowData['Lead Name'] || '').trim();
          const companyName = (rowData['Company Name'] || '').trim();

          if (!leadName) {
            const msg = `Row ${rowNumber}: Lead Name is required`;
            messages.push(msg);
            errorDetails.push({ row: rowNumber, error: 'Missing Lead Name', data: rowData });
            errors++;
            continue;
          }

          if (!companyName) {
            const msg = `Row ${rowNumber}: Company Name is required`;
            messages.push(msg);
            errorDetails.push({ row: rowNumber, error: 'Missing Company Name', data: rowData });
            errors++;
            continue;
          }

          // Check for duplicates
          const isDuplicate = await this.checkDuplicate(leadName, companyName);
          if (isDuplicate) {
            console.log(`Row ${rowNumber}: Duplicate found - ${leadName} at ${companyName}`);
            duplicates++;
            continue;
          }

          // Process and insert lead
          const leadToInsert = this.processRowData(rowData);
          console.log(`Row ${rowNumber}: Inserting lead:`, leadToInsert);

          const { error: insertError } = await supabase
            .from('leads')
            .insert([leadToInsert]);

          if (insertError) {
            console.error(`Row ${rowNumber}: Insert error:`, insertError);
            const msg = `Row ${rowNumber}: Database error - ${insertError.message}`;
            messages.push(msg);
            errorDetails.push({ 
              row: rowNumber, 
              error: insertError.message, 
              data: rowData,
              leadData: leadToInsert 
            });
            errors++;
          } else {
            success++;
            console.log(`Row ${rowNumber}: Successfully imported - ${leadName}`);
          }

        } catch (rowError: any) {
          console.error(`Row ${rowNumber}: Processing error:`, rowError);
          const msg = `Row ${rowNumber}: Processing error - ${rowError.message}`;
          messages.push(msg);
          errorDetails.push({ 
            row: rowNumber, 
            error: rowError.message, 
            data: rowData 
          });
          errors++;
        }
      }

      const result: LeadsImportResult = {
        success,
        duplicates,
        errors,
        messages: [...warnings, ...messages],
        errorDetails
      };

      console.log('=== LEADS IMPORT COMPLETE ===');
      console.log('Results:', result);

      return result;

    } catch (error: any) {
      console.error('=== LEADS IMPORT FAILED ===');
      console.error('Import error:', error);
      
      return {
        success: 0,
        duplicates: 0,
        errors: 1,
        messages: [`Import failed: ${error.message}`],
        errorDetails: [{ error: error.message, details: error }]
      };
    }
  }
}

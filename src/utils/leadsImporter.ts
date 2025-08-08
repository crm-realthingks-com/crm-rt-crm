
import { supabase } from '@/integrations/supabase/client';

export interface LeadsImportResult {
  success: number;
  duplicates: number;
  errors: number;
  messages: string[];
  errorDetails: any[];
}

export interface ImportedLeadData {
  lead_name: string;
  company_name: string;
  position?: string;
  email?: string;
  phone_no?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  country?: string;
  status?: string;
  description?: string;
  contact_owner: string;
  created_by: string;
  modified_by: string;
}

// Valid dropdown values that match the database
const VALID_SOURCES = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Partner', 'Advertisement', 'Other'];
const VALID_INDUSTRIES = ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Other'];
const VALID_REGIONS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Australia', 'Other'];
const VALID_STATUSES = ['New', 'Contacted', 'Qualified'];

export class LeadsImporter {
  private users: any[];
  private currentUserId: string;

  constructor(users: any[], currentUserId: string) {
    this.users = users || [];
    this.currentUserId = currentUserId;
  }

  private parseCSV(text: string): string[][] {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const result: string[][] = [];

    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      let i = 0;

      while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped quote
            current += '"';
            i += 2;
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
            i++;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
          i++;
        } else {
          current += char;
          i++;
        }
      }
      
      row.push(current.trim());
      result.push(row.map(field => field.replace(/^"|"$/g, '')));
    }

    return result;
  }

  private mapHeaderToField(header: string): string | null {
    const headerMap: Record<string, string> = {
      'Lead Name': 'lead_name',
      'Company Name': 'company_name',
      'Position': 'position',
      'Email': 'email',
      'Phone Number': 'phone_no',
      'LinkedIn': 'linkedin',
      'Website': 'website',
      'Lead Source': 'contact_source',
      'Industry': 'industry',
      'Region': 'country',
      'Status': 'status',
      'Description': 'description',
      'Lead Owner': 'contact_owner'
    };

    // Exact match first
    if (headerMap[header]) {
      return headerMap[header];
    }

    // Case insensitive match
    const lowerHeader = header.toLowerCase();
    for (const [key, value] of Object.entries(headerMap)) {
      if (key.toLowerCase() === lowerHeader) {
        return value;
      }
    }

    return null;
  }

  private validateDropdownValue(value: string, validValues: string[]): string {
    if (!value || !value.trim()) return '';
    
    const trimmedValue = value.trim();
    const match = validValues.find(v => v.toLowerCase() === trimmedValue.toLowerCase());
    return match || '';
  }

  private resolveOwnerId(ownerValue: string): string {
    if (!ownerValue || !ownerValue.trim()) {
      return this.currentUserId;
    }

    const trimmedValue = ownerValue.trim();
    
    // Check if it's already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmedValue)) {
      return trimmedValue;
    }

    // Find user by display name, full name, or email
    const user = this.users.find(u => 
      (u.display_name && u.display_name.toLowerCase() === trimmedValue.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase() === trimmedValue.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === trimmedValue.toLowerCase())
    );

    return user?.id || this.currentUserId;
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
        console.error('Duplicate check error:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Duplicate check exception:', error);
      return false;
    }
  }

  private processRowData(rowData: Record<string, string>): ImportedLeadData {
    return {
      lead_name: (rowData.lead_name || '').trim(),
      company_name: (rowData.company_name || '').trim(),
      position: rowData.position?.trim() || null,
      email: rowData.email?.trim() || null,
      phone_no: rowData.phone_no?.trim() || null,
      linkedin: rowData.linkedin?.trim() || null,
      website: rowData.website?.trim() || null,
      contact_source: this.validateDropdownValue(rowData.contact_source || '', VALID_SOURCES) || null,
      industry: this.validateDropdownValue(rowData.industry || '', VALID_INDUSTRIES) || null,
      country: this.validateDropdownValue(rowData.country || '', VALID_REGIONS) || null,
      status: this.validateDropdownValue(rowData.status || 'New', VALID_STATUSES) || 'New',
      description: rowData.description?.trim() || null,
      contact_owner: this.resolveOwnerId(rowData.contact_owner || ''),
      created_by: this.currentUserId,
      modified_by: this.currentUserId
    };
  }

  async importFromFile(file: File): Promise<LeadsImportResult> {
    console.log('=== STARTING LEADS IMPORT ===');
    console.log('File:', file.name, 'Size:', file.size);

    try {
      // Read file content
      const text = await file.text();
      if (!text.trim()) {
        throw new Error('File is empty');
      }

      // Parse CSV
      const csvData = this.parseCSV(text);
      if (csvData.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }

      // Get headers and create field mapping
      const headers = csvData[0];
      console.log('CSV Headers:', headers);

      const fieldMapping: Record<number, string> = {};
      const mappingWarnings: string[] = [];

      headers.forEach((header, index) => {
        const fieldName = this.mapHeaderToField(header);
        if (fieldName) {
          fieldMapping[index] = fieldName;
        } else {
          mappingWarnings.push(`Unknown column "${header}" will be ignored`);
        }
      });

      console.log('Field Mapping:', fieldMapping);

      // Check for required fields
      const mappedFields = Object.values(fieldMapping);
      if (!mappedFields.includes('lead_name')) {
        throw new Error('Required column "Lead Name" not found in CSV');
      }
      if (!mappedFields.includes('company_name')) {
        throw new Error('Required column "Company Name" not found in CSV');
      }

      // Process data rows
      const dataRows = csvData.slice(1);
      let success = 0;
      let duplicates = 0;
      let errors = 0;
      const messages: string[] = [...mappingWarnings];
      const errorDetails: any[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNumber = i + 2; // +2 because we start from row 1 and skip header

        try {
          // Map row data to fields
          const rowData: Record<string, string> = {};
          Object.entries(fieldMapping).forEach(([colIndex, fieldName]) => {
            const value = row[parseInt(colIndex)] || '';
            rowData[fieldName] = value.trim();
          });

          console.log(`Row ${rowNumber} data:`, rowData);

          // Validate required fields
          if (!rowData.lead_name) {
            const msg = `Row ${rowNumber}: Lead Name is required`;
            messages.push(msg);
            errorDetails.push({ row: rowNumber, error: 'Missing Lead Name', data: rowData });
            errors++;
            continue;
          }

          if (!rowData.company_name) {
            const msg = `Row ${rowNumber}: Company Name is required`;
            messages.push(msg);
            errorDetails.push({ row: rowNumber, error: 'Missing Company Name', data: rowData });
            errors++;
            continue;
          }

          // Check for duplicates
          const isDuplicate = await this.checkDuplicate(rowData.lead_name, rowData.company_name);
          if (isDuplicate) {
            console.log(`Row ${rowNumber}: Duplicate found`);
            duplicates++;
            continue;
          }

          // Process and insert lead
          const leadData = this.processRowData(rowData);
          console.log(`Row ${rowNumber}: Inserting:`, leadData);

          const { error: insertError } = await supabase
            .from('leads')
            .insert([leadData]);

          if (insertError) {
            console.error(`Row ${rowNumber}: Insert error:`, insertError);
            const msg = `Row ${rowNumber}: ${insertError.message}`;
            messages.push(msg);
            errorDetails.push({ 
              row: rowNumber, 
              error: insertError.message, 
              data: rowData,
              processedData: leadData
            });
            errors++;
          } else {
            success++;
            console.log(`Row ${rowNumber}: Success`);
          }

        } catch (rowError: any) {
          console.error(`Row ${rowNumber}: Processing error:`, rowError);
          const msg = `Row ${rowNumber}: ${rowError.message}`;
          messages.push(msg);
          errorDetails.push({ 
            row: rowNumber, 
            error: rowError.message, 
            rawData: row 
          });
          errors++;
        }
      }

      const result: LeadsImportResult = {
        success,
        duplicates,
        errors,
        messages,
        errorDetails
      };

      console.log('=== IMPORT COMPLETE ===', result);
      return result;

    } catch (error: any) {
      console.error('=== IMPORT FAILED ===', error);
      return {
        success: 0,
        duplicates: 0,
        errors: 1,
        messages: [`Import failed: ${error.message}`],
        errorDetails: [{ error: error.message }]
      };
    }
  }
}

import { supabase } from '@/integrations/supabase/client';

export interface ImportResult {
  success: number;
  duplicates: number;
  errors: number;
  messages: string[];
  errorDetails: any[];
}

export interface ExportOptions {
  includeOwnerNames?: boolean;
  userDisplayNames?: Record<string, string>;
}

export class CSVImportExport {
  // CSV parsing utility
  private static parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) throw new Error('Empty CSV file');
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = lines.slice(1).map(line => {
      const row = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      return row.map(field => field.replace(/^"|"$/g, ''));
    });
    
    return { headers, rows };
  }

  // CSV generation utility
  private static generateCSV(data: any[], headers: string[]): string {
    const csvRows = [headers];
    
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header] || '';
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(row);
    });
    
    return csvRows.map(row => row.join(',')).join('\n');
  }

  // Download CSV file
  private static downloadCSV(content: string, filename: string): void {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Helper function to resolve user ID from display name, email, or UUID
  private static async resolveUserId(ownerValue: string, currentUserId: string): Promise<string> {
    if (!ownerValue || !ownerValue.trim()) {
      return currentUserId;
    }

    const trimmedValue = ownerValue.trim();
    
    // Check if it's already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmedValue)) {
      return trimmedValue;
    }

    try {
      // Fetch all users to match by display name or email
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      
      if (error || !users) {
        console.warn('Could not fetch users for owner resolution:', error);
        return currentUserId;
      }

      // Find user by display name or email
      const user = users.find(u => 
        (u.user_metadata?.display_name && u.user_metadata.display_name.toLowerCase() === trimmedValue.toLowerCase()) ||
        (u.user_metadata?.full_name && u.user_metadata.full_name.toLowerCase() === trimmedValue.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === trimmedValue.toLowerCase())
      );

      return user?.id || currentUserId;
    } catch (error) {
      console.warn('Error resolving user ID:', error);
      return currentUserId;
    }
  }

  // Contacts Import
  static async importContacts(file: File, userId: string): Promise<ImportResult> {
    try {
      const text = await file.text();
      const { headers, rows } = this.parseCSV(text);
      
      console.log('Importing contacts - Headers:', headers);
      console.log('Importing contacts - Rows count:', rows.length);
      
      const headerMap: Record<string, string> = {
        'Contact Name': 'contact_name',
        'Company Name': 'company_name',
        'Position': 'position',
        'Email': 'email',
        'Phone Number': 'phone_no',
        'Mobile Number': 'mobile_no',
        'LinkedIn': 'linkedin',
        'Website': 'website',
        'Contact Source': 'contact_source',
        'Lead Status': 'lead_status',
        'Industry': 'industry',
        'City': 'city',
        'State': 'state',
        'Country': 'country',
        'Description': 'description',
        'Annual Revenue': 'annual_revenue',
        'Number of Employees': 'no_of_employees',
        'Contact Owner': 'contact_owner'
      };

      let success = 0, duplicates = 0, errors = 0;
      const messages: string[] = [];
      const errorDetails: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const contact: any = {
            created_by: userId,
            modified_by: userId,
            contact_owner: userId
          };

          // Map fields
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const dbField = headerMap[header];
            if (dbField && row[j]) {
              let value = row[j].trim();
              
              if (dbField === 'contact_owner') {
                contact[dbField] = await this.resolveUserId(value, userId);
              } else if (dbField === 'annual_revenue' || dbField === 'no_of_employees') {
                const numValue = parseFloat(value);
                contact[dbField] = isNaN(numValue) ? null : numValue;
              } else {
                contact[dbField] = value || null;
              }
            }
          }

          // Validate required fields
          if (!contact.contact_name) {
            messages.push(`Row ${i + 2}: Contact Name is required`);
            errors++;
            errorDetails.push({ row: i + 2, message: 'Contact Name is required' });
            continue;
          }

          // Check for duplicates
          const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('contact_name', contact.contact_name)
            .eq('company_name', contact.company_name || '')
            .limit(1);

          if (existing && existing.length > 0) {
            duplicates++;
            continue;
          }

          // Insert contact
          const { error } = await supabase
            .from('contacts')
            .insert([contact]);

          if (error) {
            console.error(`Row ${i + 2}: Insert error:`, error);
            messages.push(`Row ${i + 2}: ${error.message}`);
            errors++;
            errorDetails.push({ row: i + 2, message: error.message });
          } else {
            success++;
          }
        } catch (rowError: any) {
          console.error(`Row ${i + 2}: Processing error:`, rowError);
          messages.push(`Row ${i + 2}: ${rowError.message}`);
          errors++;
          errorDetails.push({ row: i + 2, message: rowError.message });
        }
      }

      return { success, duplicates, errors, messages, errorDetails };
    } catch (error: any) {
      console.error('Import failed:', error);
      return { success: 0, duplicates: 0, errors: 1, messages: [error.message], errorDetails: [{ message: error.message }] };
    }
  }

  // Leads Import - with proper user resolution
  static async importLeads(file: File, userId: string): Promise<ImportResult> {
    try {
      const text = await file.text();
      const { headers, rows } = this.parseCSV(text);
      
      console.log('Importing leads - Headers:', headers);
      console.log('Importing leads - Rows count:', rows.length);
      
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

      // Valid dropdown values
      const validSources = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Partner', 'Advertisement', 'Other'];
      const validIndustries = ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Other'];
      const validRegions = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Australia', 'Other'];
      const validStatuses = ['New', 'Contacted', 'Qualified'];

      const validateDropdownValue = (value: string, validValues: string[]): string => {
        if (!value || !value.trim()) return '';
        const trimmedValue = value.trim();
        const match = validValues.find(v => v.toLowerCase() === trimmedValue.toLowerCase());
        return match || '';
      };

      let success = 0, duplicates = 0, errors = 0;
      const messages: string[] = [];
      const errorDetails: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const lead: any = {
            created_by: userId,
            modified_by: userId,
            contact_owner: userId
          };

          // Map fields
          for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const dbField = headerMap[header];
            if (dbField && row[j]) {
              let value = row[j].trim();
              
              // Handle Lead Owner field with proper user resolution
              if (dbField === 'contact_owner') {
                lead[dbField] = await this.resolveUserId(value, userId);
                console.log(`Row ${i + 2}: Resolved owner "${value}" to "${lead[dbField]}"`);
              } else if (dbField === 'contact_source') {
                lead[dbField] = validateDropdownValue(value, validSources) || null;
              } else if (dbField === 'industry') {
                lead[dbField] = validateDropdownValue(value, validIndustries) || null;
              } else if (dbField === 'country') {
                lead[dbField] = validateDropdownValue(value, validRegions) || null;
              } else if (dbField === 'status') {
                lead[dbField] = validateDropdownValue(value, validStatuses) || 'New';
              } else {
                lead[dbField] = value || null;
              }
            }
          }

          // Set default status if not provided
          if (!lead.status) {
            lead.status = 'New';
          }

          console.log(`Row ${i + 2}: Processing lead:`, lead);

          // Validate required fields
          if (!lead.lead_name) {
            messages.push(`Row ${i + 2}: Lead Name is required`);
            errors++;
            errorDetails.push({ row: i + 2, message: 'Lead Name is required' });
            continue;
          }

          if (!lead.company_name) {
            messages.push(`Row ${i + 2}: Company Name is required`);
            errors++;
            errorDetails.push({ row: i + 2, message: 'Company Name is required' });
            continue;
          }

          // Check for duplicates
          const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('lead_name', lead.lead_name)
            .eq('company_name', lead.company_name)
            .limit(1);

          if (existing && existing.length > 0) {
            console.log(`Row ${i + 2}: Duplicate found, skipping`);
            duplicates++;
            continue;
          }

          // Insert lead
          const { error } = await supabase
            .from('leads')
            .insert([lead]);

          if (error) {
            console.error(`Row ${i + 2}: Insert error:`, error);
            messages.push(`Row ${i + 2}: ${error.message}`);
            errors++;
            errorDetails.push({ row: i + 2, message: error.message });
          } else {
            console.log(`Row ${i + 2}: Successfully inserted lead`);
            success++;
          }
        } catch (rowError: any) {
          console.error(`Row ${i + 2}: Processing error:`, rowError);
          messages.push(`Row ${i + 2}: ${rowError.message}`);
          errors++;
          errorDetails.push({ row: i + 2, message: rowError.message });
        }
      }

      return { success, duplicates, errors, messages, errorDetails };
    } catch (error: any) {
      console.error('Leads import failed:', error);
      return { success: 0, duplicates, errors: 1, messages: [error.message], errorDetails: [{ message: error.message }] };
    }
  }

  // Contacts Export
  static async exportContacts(contacts: any[], options: ExportOptions = {}): Promise<void> {
    const headers = [
      'Contact Name', 'Company Name', 'Position', 'Email', 'Phone Number', 'Mobile Number',
      'LinkedIn', 'Website', 'Contact Source', 'Lead Status', 'Industry', 'City', 'State',
      'Country', 'Description', 'Annual Revenue', 'Number of Employees', 'Contact Owner'
    ];

    const exportData = contacts.map(contact => ({
      'Contact Name': contact.contact_name || '',
      'Company Name': contact.company_name || '',
      'Position': contact.position || '',
      'Email': contact.email || '',
      'Phone Number': contact.phone_no || '',
      'Mobile Number': contact.mobile_no || '',
      'LinkedIn': contact.linkedin || '',
      'Website': contact.website || '',
      'Contact Source': contact.contact_source || '',
      'Lead Status': contact.lead_status || '',
      'Industry': contact.industry || '',
      'City': contact.city || '',
      'State': contact.state || '',
      'Country': contact.country || '',
      'Description': contact.description || '',
      'Annual Revenue': contact.annual_revenue || '',
      'Number of Employees': contact.no_of_employees || '',
      'Contact Owner': options.userDisplayNames?.[contact.contact_owner] || contact.contact_owner || ''
    }));

    const csvContent = this.generateCSV(exportData, headers);
    const filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadCSV(csvContent, filename);
  }

  // Leads Export - matching contacts exactly
  static async exportLeads(leads: any[], options: ExportOptions = {}): Promise<void> {
    const headers = [
      'Lead Name', 'Company Name', 'Position', 'Email', 'Phone Number',
      'LinkedIn', 'Website', 'Lead Source', 'Industry', 'Region',
      'Status', 'Description', 'Lead Owner'
    ];

    const exportData = leads.map(lead => ({
      'Lead Name': lead.lead_name || '',
      'Company Name': lead.company_name || '',
      'Position': lead.position || '',
      'Email': lead.email || '',
      'Phone Number': lead.phone_no || '',
      'LinkedIn': lead.linkedin || '',
      'Website': lead.website || '',
      'Lead Source': lead.contact_source || '',
      'Industry': lead.industry || '',
      'Region': lead.country || '',
      'Status': lead.status || lead.lead_status || '',
      'Description': lead.description || '',
      'Lead Owner': options.userDisplayNames?.[lead.contact_owner] || lead.contact_owner || ''
    }));

    const csvContent = this.generateCSV(exportData, headers);
    const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    this.downloadCSV(csvContent, filename);
  }
}

// Enhanced CSV Import/Export utilities for Contacts and Leads
import { supabase } from '@/integrations/supabase/client';
import { CSVParser } from './csvParser';
import { exportContactsToCSV, exportLeadsToCSV, parseContactsCSVFile, parseLeadsCSVFile, downloadCSV, ContactCSVRow, LeadCSVRow } from './csvUtils';

export interface ImportResult {
  success: number;
  duplicates: number;
  errors: number;
  messages: string[];
}

export interface ExportOptions {
  includeOwnerNames?: boolean;
  userDisplayNames?: Record<string, string>;
}

export class CSVImportExport {
  
  // Export Contacts with all fields
  static async exportContacts(contacts: any[], options: ExportOptions = {}): Promise<void> {
    try {
      console.log('Exporting contacts:', contacts.length);
      
      const csvContent = exportContactsToCSV(contacts, options.userDisplayNames || {});
      const filename = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      const success = downloadCSV(csvContent, filename);
      if (!success) {
        throw new Error('Failed to download CSV file');
      }
      
      console.log('Contacts export completed successfully');
    } catch (error) {
      console.error('Export contacts error:', error);
      throw error;
    }
  }

  // Export Leads with all fields
  static async exportLeads(leads: any[], options: ExportOptions = {}): Promise<void> {
    try {
      console.log('Exporting leads:', leads.length);
      
      const csvContent = exportLeadsToCSV(leads, options.userDisplayNames || {});
      const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      const success = downloadCSV(csvContent, filename);
      if (!success) {
        throw new Error('Failed to download CSV file');
      }
      
      console.log('Leads export completed successfully');
    } catch (error) {
      console.error('Export leads error:', error);
      throw error;
    }
  }

  // Import Contacts with validation and duplicate checking
  static async importContacts(file: File, currentUserId: string): Promise<ImportResult> {
    try {
      console.log('CSVImportExport.importContacts called with file:', file.name, 'size:', file.size, 'type:', file.type);
      console.log('Current user ID:', currentUserId);
      
      const contacts = await parseContactsCSVFile(file);
      console.log('Parsed contacts from CSV:', contacts.length, 'contacts:', contacts);
      
      let success = 0;
      let duplicates = 0;
      let errors = 0;
      const messages: string[] = [];

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        
        try {
          // Validate required fields
          if (!contact['Contact Name'] || contact['Contact Name'].trim() === '') {
            messages.push(`Row ${i + 1}: Contact Name is required`);
            errors++;
            continue;
          }

          // Check for duplicates
          const { data: existingContacts } = await supabase
            .from('contacts')
            .select('id')
            .eq('contact_name', contact['Contact Name'])
            .eq('company_name', contact['Company Name'] || '')
            .limit(1);

          if (existingContacts && existingContacts.length > 0) {
            console.log(`Row ${i + 1}: Duplicate contact found: ${contact['Contact Name']}`);
            duplicates++;
            continue;
          }

          // Prepare contact data for insertion
          const contactData = {
            contact_name: contact['Contact Name'],
            company_name: contact['Company Name'] || null,
            position: contact['Position'] || null,
            email: contact['Email'] || null,
            phone_no: contact['Phone'] || null,
            mobile_no: contact['Mobile'] || null,
            linkedin: contact['LinkedIn'] || null,
            website: contact['Website'] || null,
            contact_source: contact['Contact Source'] || null,
            industry: contact['Industry'] || null,
            country: contact['Region'] || null,
            city: contact['City'] || null,
            state: contact['State'] || null,
            description: contact['Description'] || null,
            annual_revenue: contact['Annual Revenue'] ? parseFloat(contact['Annual Revenue']) : null,
            no_of_employees: contact['No Of Employees'] ? parseInt(contact['No Of Employees']) : null,
            created_by: currentUserId,
            modified_by: currentUserId,
            contact_owner: currentUserId // Default to current user if no owner specified
          };

          // Insert contact
          const { error } = await supabase
            .from('contacts')
            .insert([contactData]);

          if (error) {
            console.error(`Row ${i + 1}: Insert error:`, error);
            messages.push(`Row ${i + 1}: ${error.message}`);
            errors++;
          } else {
            success++;
            console.log(`Row ${i + 1}: Successfully imported: ${contact['Contact Name']}`);
          }

        } catch (rowError: any) {
          console.error(`Row ${i + 1}: Processing error:`, rowError);
          messages.push(`Row ${i + 1}: ${rowError.message}`);
          errors++;
        }
      }

      console.log(`Contacts import completed - Success: ${success}, Duplicates: ${duplicates}, Errors: ${errors}`);
      
      return {
        success,
        duplicates,
        errors,
        messages
      };

    } catch (error: any) {
      console.error('Import contacts error:', error);
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  // Import Leads with validation and duplicate checking  
  static async importLeads(file: File, currentUserId: string): Promise<ImportResult> {
    try {
      console.log('Starting leads import from file:', file.name);
      
      const leads = await parseLeadsCSVFile(file);
      console.log('Parsed leads:', leads.length);
      
      let success = 0;
      let duplicates = 0;
      let errors = 0;
      const messages: string[] = [];

      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        
        try {
          // Validate required fields
          if (!lead['Lead Name'] || lead['Lead Name'].trim() === '') {
            messages.push(`Row ${i + 1}: Lead Name is required`);
            errors++;
            continue;
          }

          // Check for duplicates
          const { data: existingLeads } = await supabase
            .from('leads')
            .select('id')
            .eq('lead_name', lead['Lead Name'])
            .eq('company_name', lead['Company Name'] || '')
            .limit(1);

          if (existingLeads && existingLeads.length > 0) {
            console.log(`Row ${i + 1}: Duplicate lead found: ${lead['Lead Name']}`);
            duplicates++;
            continue;
          }

          // Prepare lead data for insertion
          const leadData = {
            lead_name: lead['Lead Name'],
            company_name: lead['Company Name'] || null,
            position: lead['Position'] || null,
            email: lead['Email'] || null,
            phone_no: lead['Phone'] || null,
            mobile_no: lead['Mobile'] || null,
            linkedin: lead['LinkedIn'] || null,
            website: lead['Website'] || null,
            contact_source: lead['Lead Source'] || null,
            lead_status: lead['Lead Status'] || null,
            industry: lead['Industry'] || null,
            country: lead['Region'] || null,
            city: lead['City'] || null,
            description: lead['Description'] || null,
            created_by: currentUserId,
            modified_by: currentUserId,
            contact_owner: currentUserId // Default to current user if no owner specified
          };

          // Insert lead
          const { error } = await supabase
            .from('leads')
            .insert([leadData]);

          if (error) {
            console.error(`Row ${i + 1}: Insert error:`, error);
            messages.push(`Row ${i + 1}: ${error.message}`);
            errors++;
          } else {
            success++;
            console.log(`Row ${i + 1}: Successfully imported: ${lead['Lead Name']}`);
          }

        } catch (rowError: any) {
          console.error(`Row ${i + 1}: Processing error:`, rowError);
          messages.push(`Row ${i + 1}: ${rowError.message}`);
          errors++;
        }
      }

      console.log(`Leads import completed - Success: ${success}, Duplicates: ${duplicates}, Errors: ${errors}`);
      
      return {
        success,
        duplicates,
        errors,
        messages
      };

    } catch (error: any) {
      console.error('Import leads error:', error);
      throw new Error(`Import failed: ${error.message}`);
    }
  }
}
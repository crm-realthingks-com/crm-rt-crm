
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
export interface LeadImportResult {
  success: number;
  duplicates: number;
  errors: number;
  messages: string[];
}

export interface LeadExportData {
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

export const useLeadsImportExport = () => {
  const { user } = useAuth();
  const { users } = useUsers();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Valid dropdown values matching the Add Lead form
  const validSources = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Partner', 'Advertisement', 'Other'];
  const validIndustries = ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Other'];
  const validRegions = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Australia', 'Other'];
  const validStatuses = ['New', 'Contacted', 'Qualified'];

  const exportLeads = async (leads: any[], userDisplayNames: Record<string, string> = {}) => {
    setIsExporting(true);
    try {
      console.log('Exporting leads:', leads.length);
      
      if (!leads || leads.length === 0) {
        toast({
          title: "No Data",
          description: "No leads available to export",
          variant: "destructive",
        });
        return;
      }

      // Headers matching exactly the Add Lead form fields
      const headers = [
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

      // Convert leads to CSV rows using the exact database field mappings
      const csvRows = leads.map(lead => [
        lead.lead_name || '',
        lead.company_name || '',
        lead.position || '',
        lead.email || '',
        lead.phone_no || '',
        lead.linkedin || '',
        lead.website || '',
        lead.contact_source || '',
        lead.industry || '',
        lead.country || '',
        lead.status || lead.lead_status || '',
        lead.description || '',
        userDisplayNames[lead.contact_owner] || lead.contact_owner || ''
      ]);

      // Combine headers and data
      const allRows = [headers, ...csvRows];

      // Convert to CSV string
      const csvContent = allRows
        .map(row => 
          row.map(field => {
            const str = String(field || '');
            // If field contains comma, quote, or newline, wrap in quotes and escape quotes
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          }).join(',')
        )
        .join('\n');

      // Create blob with UTF-8 BOM for better Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "Export Successful",
        description: `Successfully exported ${leads.length} leads to CSV.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const parseCSVLine = (line: string): string[] => {
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
    return result.map(field => field.replace(/^"|"$/g, '')); // Remove surrounding quotes
  };

  const validateDropdownValue = (value: string, validValues: string[], fieldName: string): string => {
    if (!value || value.trim() === '') return '';
    
    const trimmedValue = value.trim();
    // Case-insensitive matching
    const matchedValue = validValues.find(v => v.toLowerCase() === trimmedValue.toLowerCase());
    
    if (matchedValue) {
      return matchedValue;
    }
    
    console.warn(`Invalid ${fieldName} value: "${trimmedValue}". Valid values: ${validValues.join(', ')}`);
    return ''; // Return empty string for invalid values
  };

  const resolveOwnerId = (ownerValue?: string): string => {
    const fallback = user?.id || '';
    const v = (ownerValue || '').trim();
    if (!v) return fallback;
    // UUID pattern
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(v)) return v;
    const found = users?.find(u => (
      (u.display_name && u.display_name.toLowerCase() === v.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase() === v.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === v.toLowerCase())
    ));
    return found?.id || fallback;
  };

  const importLeads = async (file: File): Promise<LeadImportResult> => {
    console.log('importLeads function called with file:', file.name);
    setIsImporting(true);
    
    try {
      if (!user) {
        console.error('No user found for import');
        throw new Error('You must be logged in to import leads');
      }

      console.log('Reading file content...');
      const text = await file.text();
      console.log('File content length:', text.length);
      
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
      console.log('Total lines after filtering:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
      }

      // Parse headers
      const headers = parseCSVLine(lines[0]);
      console.log('CSV headers parsed:', headers);

      // Expected headers from the Add Lead form
      const expectedHeaders = [
        'Lead Name', 'Company Name', 'Position', 'Email', 'Phone Number',
        'LinkedIn', 'Website', 'Lead Source', 'Industry', 'Region', 
        'Status', 'Description', 'Lead Owner'
      ];

      console.log('Expected headers:', expectedHeaders);

      // Parse all data rows
      const csvData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const rowData: any = {};
        
        // Map headers to values with flexible matching
        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          // Map to expected field names
          switch (header.toLowerCase().trim()) {
            case 'lead name':
            case 'name':
              rowData['Lead Name'] = value;
              break;
            case 'company name':
            case 'company':
              rowData['Company Name'] = value;
              break;
            case 'position':
            case 'title':
            case 'job title':
              rowData['Position'] = value;
              break;
            case 'email':
            case 'email address':
              rowData['Email'] = value;
              break;
            case 'phone number':
            case 'phone':
            case 'phone_no':
              rowData['Phone Number'] = value;
              break;
            case 'linkedin':
            case 'linkedin profile':
              rowData['LinkedIn'] = value;
              break;
            case 'website':
            case 'website url':
              rowData['Website'] = value;
              break;
            case 'lead source':
            case 'source':
            case 'contact source':
              rowData['Lead Source'] = value;
              break;
            case 'industry':
              rowData['Industry'] = value;
              break;
            case 'region':
            case 'country':
              rowData['Region'] = value;
              break;
            case 'status':
            case 'lead status':
              rowData['Status'] = value;
              break;
            case 'description':
            case 'notes':
              rowData['Description'] = value;
              break;
            case 'lead owner':
            case 'owner':
            case 'contact owner':
              rowData['Lead Owner'] = value;
              break;
            default:
              // Try to match with exact header name
              rowData[header] = value;
              break;
          }
        });
        
        csvData.push(rowData);
      }

      console.log('Parsed CSV data:', csvData.length, 'rows');

      // Process leads directly here instead of using edge function
      let success = 0;
      let duplicates = 0;
      let errors = 0;
      const messages: string[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const rowData = csvData[i];
        
        try {
          // Validate required fields
          if (!rowData['Lead Name'] || rowData['Lead Name'].trim() === '') {
            messages.push(`Row ${i + 1}: Lead Name is required`);
            errors++;
            continue;
          }

          if (!rowData['Company Name'] || rowData['Company Name'].trim() === '') {
            messages.push(`Row ${i + 1}: Company Name is required`);
            errors++;
            continue;
          }

          // Check for duplicates
          const { data: existingLeads } = await supabase
            .from('leads')
            .select('id')
            .eq('lead_name', rowData['Lead Name'])
            .eq('company_name', rowData['Company Name'])
            .limit(1);

          if (existingLeads && existingLeads.length > 0) {
            duplicates++;
            continue;
          }

          // Map to database fields with validation
          const lead = {
            lead_name: rowData['Lead Name'],
            company_name: rowData['Company Name'],
            position: rowData['Position'] || null,
            email: rowData['Email'] || null,
            phone_no: rowData['Phone Number'] || null,
            linkedin: rowData['LinkedIn'] || null,
            website: rowData['Website'] || null,
            contact_source: validateDropdownValue(rowData['Lead Source'] || '', validSources, 'Lead Source') || null,
            industry: validateDropdownValue(rowData['Industry'] || '', validIndustries, 'Industry') || null,
            country: validateDropdownValue(rowData['Region'] || '', validRegions, 'Region') || null,
            status: validateDropdownValue(rowData['Status'] || 'New', validStatuses, 'Status') || 'New',
            description: rowData['Description'] || null,
            created_by: user.id,
            modified_by: user.id,
            contact_owner: resolveOwnerId(rowData['Lead Owner'])
          };

          console.log(`Row ${i + 1}: Inserting lead:`, lead);

          // Insert lead
          const { error: insertError } = await supabase
            .from('leads')
            .insert([lead]);

          if (insertError) {
            console.error(`Row ${i + 1}: Insert error:`, insertError);
            messages.push(`Row ${i + 1}: ${insertError.message}`);
            errors++;
          } else {
            success++;
            console.log(`Row ${i + 1}: Successfully imported: ${rowData['Lead Name']}`);
          }

        } catch (rowError: any) {
          console.error(`Row ${i + 1}: Processing error:`, rowError);
          messages.push(`Row ${i + 1}: ${rowError.message}`);
          errors++;
        }
      }

      console.log(`Import completed - Success: ${success}, Duplicates: ${duplicates}, Errors: ${errors}`);
      
      return {
        success,
        duplicates,
        errors,
        messages
      };

    } catch (error: any) {
      console.error('Import error:', error);
      throw new Error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return {
    exportLeads,
    importLeads,
    isImporting,
    isExporting,
    parseCSVLine,
    validateDropdownValue
  };
};

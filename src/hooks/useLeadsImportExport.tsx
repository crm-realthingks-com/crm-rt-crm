import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';

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

export interface LeadsImportResult {
  success: number;
  duplicates: number;
  errors: number;
  messages: string[];
  errorDetails: any[];
}

export const useLeadsImportExport = () => {
  const { user } = useAuth();
  const { users } = useUsers();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Expected headers from export - canonical list
  const expectedHeaders = [
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

  // Valid dropdown values that match the database
  const VALID_SOURCES = ['Website', 'LinkedIn', 'Referral', 'Cold Call', 'Email', 'Social Media', 'Event', 'Partner', 'Advertisement', 'Other'];
  const VALID_INDUSTRIES = ['Automotive', 'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Other'];
  const VALID_REGIONS = ['North America', 'South America', 'Europe', 'Asia', 'Africa', 'Australia', 'Other'];
  const VALID_STATUSES = ['New', 'Contacted', 'Qualified'];

  const validateDropdownValue = (value: string, validValues: string[]): string => {
    if (!value || !value.trim()) return '';
    
    const trimmedValue = value.trim();
    const match = validValues.find(v => v.toLowerCase() === trimmedValue.toLowerCase());
    return match || '';
  };

  const resolveOwnerId = (ownerValue: string): string => {
    if (!ownerValue || !ownerValue.trim()) {
      return user?.id || '';
    }

    const trimmedValue = ownerValue.trim();
    
    // Check if it's already a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmedValue)) {
      return trimmedValue;
    }

    // Find user by display name, full name, or email
    const foundUser = users?.find(u => 
      (u.display_name && u.display_name.toLowerCase() === trimmedValue.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase() === trimmedValue.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === trimmedValue.toLowerCase())
    );

    return foundUser?.id || user?.id || '';
  };

  const parseCSV = (text: string): string[][] => {
    console.log('=== PARSING CSV ===');
    console.log('CSV text length:', text.length);
    console.log('First 200 chars:', text.substring(0, 200));

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

    console.log('Parsed CSV rows:', result.length);
    console.log('First row (headers):', result[0]);
    return result;
  };

  const mapHeaderToField = (header: string): string | null => {
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
  };

  const checkDuplicate = async (leadName: string, companyName: string): Promise<boolean> => {
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
  };

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

      // Convert leads to CSV rows using exact database field mappings
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
      const allRows = [expectedHeaders, ...csvRows];

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

  const importLeads = async (file: File): Promise<LeadsImportResult> => {
    console.log('=== IMPORT LEADS FUNCTION CALLED ===');
    console.log('File:', file.name, 'Size:', file.size, 'User:', user?.id);
    
    setIsImporting(true);
    
    try {
      if (!user) {
        throw new Error('You must be logged in to import leads');
      }

      // Read file content
      console.log('Reading file content...');
      const text = await file.text();
      if (!text.trim()) {
        throw new Error('File is empty');
      }
      console.log('File content read successfully, length:', text.length);

      // Parse CSV
      console.log('Parsing CSV...');
      const csvData = parseCSV(text);
      if (csvData.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }
      console.log('CSV parsed successfully, rows:', csvData.length);

      // Get headers and create field mapping
      const headers = csvData[0];
      console.log('CSV Headers:', headers);

      const fieldMapping: Record<number, string> = {};
      const mappingWarnings: string[] = [];

      headers.forEach((header, index) => {
        const fieldName = mapHeaderToField(header);
        if (fieldName) {
          fieldMapping[index] = fieldName;
          console.log(`Mapped column ${index} "${header}" -> ${fieldName}`);
        } else {
          mappingWarnings.push(`Unknown column "${header}" will be ignored`);
          console.warn(`Unknown column "${header}" at index ${index}`);
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

      console.log(`Processing ${dataRows.length} data rows...`);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNumber = i + 2; // +2 because we start from row 1 and skip header

        try {
          console.log(`Processing row ${rowNumber}:`, row);

          // Map row data to fields
          const rowData: Record<string, string> = {};
          Object.entries(fieldMapping).forEach(([colIndex, fieldName]) => {
            const value = row[parseInt(colIndex)] || '';
            rowData[fieldName] = value.trim();
          });

          console.log(`Row ${rowNumber} mapped data:`, rowData);

          // Validate required fields
          if (!rowData.lead_name) {
            const msg = `Row ${rowNumber}: Lead Name is required`;
            messages.push(msg);
            errorDetails.push({ row: rowNumber, error: 'Missing Lead Name', data: rowData });
            errors++;
            console.error(msg);
            continue;
          }

          if (!rowData.company_name) {
            const msg = `Row ${rowNumber}: Company Name is required`;
            messages.push(msg);
            errorDetails.push({ row: rowNumber, error: 'Missing Company Name', data: rowData });
            errors++;
            console.error(msg);
            continue;
          }

          // Check for duplicates
          console.log(`Checking for duplicates: ${rowData.lead_name} - ${rowData.company_name}`);
          const isDuplicate = await checkDuplicate(rowData.lead_name, rowData.company_name);
          if (isDuplicate) {
            console.log(`Row ${rowNumber}: Duplicate found`);
            duplicates++;
            continue;
          }

          // Process lead data
          const leadData = {
            lead_name: rowData.lead_name,
            company_name: rowData.company_name,
            position: rowData.position || null,
            email: rowData.email || null,
            phone_no: rowData.phone_no || null,
            linkedin: rowData.linkedin || null,
            website: rowData.website || null,
            contact_source: validateDropdownValue(rowData.contact_source || '', VALID_SOURCES) || null,
            industry: validateDropdownValue(rowData.industry || '', VALID_INDUSTRIES) || null,
            country: validateDropdownValue(rowData.country || '', VALID_REGIONS) || null,
            status: validateDropdownValue(rowData.status || 'New', VALID_STATUSES) || 'New',
            description: rowData.description || null,
            contact_owner: resolveOwnerId(rowData.contact_owner || ''),
            created_by: user.id,
            modified_by: user.id
          };

          console.log(`Row ${rowNumber}: Inserting lead:`, leadData);

          // Insert lead
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
            console.log(`Row ${rowNumber}: Successfully inserted`);
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
    } finally {
      setIsImporting(false);
    }
  };

  return {
    exportLeads,
    importLeads,
    isImporting,
    isExporting
  };
};

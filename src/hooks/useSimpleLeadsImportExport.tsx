import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  lead_name: string;
  company_name?: string;
  email?: string;
  phone_no?: string;
  position?: string;
  created_by?: string;
  contact_owner?: string;
  lead_status?: string;
  created_time?: string;
  modified_time?: string;
  linkedin?: string;
  website?: string;
  contact_source?: string;
  industry?: string;
  country?: string;
  description?: string;
}

const fieldMapping: { [key: string]: string } = {
  'name': 'lead_name',
  'company': 'company_name',
  'email': 'email',
  'phone': 'phone_no',
  'title': 'position',
  'owner': 'contact_owner',
  'status': 'lead_status',
  'linkedin': 'linkedin',
  'website': 'website',
  'source': 'contact_source',
  'industry': 'industry',
  'country': 'country',
  'description': 'description',
  'contact_name': 'lead_name',
  'full_name': 'lead_name',
};

const prepareLead = (rowObj: any, userId: string) => {
  const leadRecord: any = {};

  // Map CSV fields to database fields
  Object.entries(fieldMapping).forEach(([csvField, dbField]) => {
    if (rowObj[csvField] !== undefined && rowObj[csvField] !== null && rowObj[csvField] !== '') {
      leadRecord[dbField] = rowObj[csvField];
    }
  });

  // Ensure lead_name is always set - this is required by the database
  if (!leadRecord.lead_name) {
    leadRecord.lead_name = rowObj.name || rowObj.contact_name || rowObj.full_name || 'Unnamed Lead';
  }

  // Handle date fields
  if (rowObj.created_time) {
    leadRecord.created_time = new Date(rowObj.created_time).toISOString();
  } else {
    leadRecord.created_time = new Date().toISOString();
  }

  if (rowObj.modified_time) {
    leadRecord.modified_time = new Date(rowObj.modified_time).toISOString();
  } else {
    leadRecord.modified_time = new Date().toISOString();
  }

  // Set metadata
  leadRecord.created_by = userId;
  leadRecord.modified_by = userId;

  return leadRecord;
};

export const useSimpleLeadsImportExport = (onImportComplete: () => void) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async (file: File) => {
    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);

      console.log('CSV Headers:', headers);
      console.log(`Processing ${dataLines.length} data rows`);

      // Process leads in batches
      const batchSize = 50;
      for (let i = 0; i < dataLines.length; i += batchSize) {
        const batch = dataLines.slice(i, i + batchSize);
        
        for (const line of batch) {
          if (!line.trim()) continue;

          try {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const rowObj: any = {};
            
            headers.forEach((header, index) => {
              rowObj[header] = values[index] || '';
            });

            console.log('Processing row:', rowObj);

            // Prepare lead record
            const leadRecord = prepareLead(rowObj, user.id);

            // Validate required fields - ensure lead_name is present and not empty
            if (!leadRecord.lead_name || leadRecord.lead_name.trim() === '') {
              errorCount++;
              errors.push('Lead name is required');
              continue;
            }

            console.log('Prepared lead record:', leadRecord);

            // Check for existing lead by email or lead_name
            let existingLead = null;
            if (leadRecord.email) {
              const { data } = await supabase
                .from('leads')
                .select('id')
                .eq('email', leadRecord.email)
                .single();
              existingLead = data;
            }

            let leadId;
            if (existingLead) {
              // Update existing lead
              leadId = existingLead.id;
              const updateData = { 
                ...leadRecord,
                modified_by: user.id,
                modified_time: new Date().toISOString()
              };
              
              const { error: updateError } = await supabase
                .from('leads')
                .update(updateData)
                .eq('id', leadId);

              if (updateError) {
                console.error('Update error:', updateError);
                errorCount++;
                errors.push(`Failed to update lead: ${updateError.message}`);
                continue;
              }

              console.log('Updated existing lead:', leadId);
            } else {
              // Insert new lead - ensure all required fields are present
              const insertData = {
                ...leadRecord,
                created_by: user.id,
                modified_by: user.id
              };

              const { data: insertedLead, error: insertError } = await supabase
                .from('leads')
                .insert([insertData])
                .select('id')
                .single();

              if (insertError) {
                console.error('Insert error:', insertError);
                errorCount++;
                errors.push(`Failed to insert lead: ${insertError.message}`);
                continue;
              }

              leadId = insertedLead.id;
              console.log('Inserted new lead:', leadId);
            }

            successCount++;

          } catch (rowError) {
            console.error('Row processing error:', rowError);
            errorCount++;
            errors.push(`Row processing failed: ${rowError.message}`);
          }
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${successCount} leads${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
        });
      }

      if (errorCount > 0 && errors.length > 0) {
        const errorSample = errors.slice(0, 3).join(', ');
        toast({
          title: "Import Errors",
          description: `${errorCount} errors occurred. Sample: ${errorSample}${errors.length > 3 ? '...' : ''}`,
          variant: "destructive",
        });
      }

      onImportComplete();

    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*');

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No leads to export.",
        });
        return;
      }

      const csvRows = [];

      // Headers
      const headers = Object.keys(data[0]);
      csvRows.push(headers.join(','));

      // Data rows
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      }

      const csvData = csvRows.join('\n');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'leads.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: "Leads exported to CSV.",
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    handleImport,
    handleExport,
    isImporting
  };
};

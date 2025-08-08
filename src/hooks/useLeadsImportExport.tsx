
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { LeadsImporter } from '@/utils/leadsImporter';

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
    console.log('=== STARTING LEADS IMPORT ===');
    console.log('File:', file.name, 'Size:', file.size, 'User ID:', user?.id);
    
    setIsImporting(true);
    
    try {
      if (!user) {
        throw new Error('You must be logged in to import leads');
      }

      if (!users || users.length === 0) {
        console.warn('No users data available for owner resolution');
      }

      // Use the LeadsImporter class
      const importer = new LeadsImporter(users || [], user.id);
      const result = await importer.importFromFile(file);

      console.log('=== IMPORT RESULT ===', result);
      return result;

    } catch (error: any) {
      console.error('=== IMPORT ERROR ===', error);
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

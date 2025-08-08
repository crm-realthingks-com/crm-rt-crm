
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { CSVImportExport } from '@/utils/csvImportExport';

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

  const handleImportFile = async (file: File): Promise<LeadsImportResult> => {
    console.log('handleImportFile called with file:', file);
    
    if (!user) {
      console.log('No user found, showing error');
      throw new Error('You must be logged in to import leads.');
    }

    console.log('Leads page: Starting CSV import with file:', file.name, 'User ID:', user.id);
    setIsImporting(true);
    
    try {
      const result = await CSVImportExport.importLeads(file, user.id);
      console.log('Import result:', result);
      
      return result;
    } catch (error: any) {
      console.error('Import error:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const importLeads = async (file: File): Promise<LeadsImportResult> => {
    return handleImportFile(file);
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

      await CSVImportExport.exportLeads(leads, {
        includeOwnerNames: true,
        userDisplayNames: userDisplayNames
      });

      toast({
        title: "Export Successful",
        description: `Exported ${leads.length} leads successfully.`,
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

  return {
    exportLeads,
    importLeads,
    handleImportFile,
    isImporting,
    isExporting
  };
};

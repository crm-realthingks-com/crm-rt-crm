
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { GenericCSVProcessor } from './import-export/genericCSVProcessor';
import { GenericCSVExporter } from './import-export/genericCSVExporter';
import { getExportFilename } from '@/utils/exportUtils';

// Leads field order including action items
const LEADS_EXPORT_FIELDS = [
  'id', 'lead_name', 'company_name', 'position', 'email', 'phone_no',
  'linkedin', 'website', 'contact_source', 'lead_status', 'industry', 'country',
  'description', 'contact_owner', 'created_by', 'modified_by',
  'created_time', 'modified_time', 'action_items_json'
];

export const useSimpleLeadsImportExport = (onRefresh: () => void) => {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (file: File) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const processor = new GenericCSVProcessor();
      
      const result = await processor.processCSV(text, {
        tableName: 'leads',
        userId: user.id,
        onProgress: (processed, total) => {
          console.log(`Progress: ${processed}/${total}`);
        }
      });

      const { successCount, updateCount, errorCount } = result;
      const message = `Import completed: ${successCount} new, ${updateCount} updated, ${errorCount} errors`;
      
      if (successCount > 0 || updateCount > 0) {
        toast({
          title: "Import Successful",
          description: message,
        });
        
        // Trigger real-time refresh
        onRefresh();
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('leads-data-updated', {
          detail: { successCount, updateCount, source: 'csv-import' }
        }));
      } else {
        toast({
          title: "Import Failed",
          description: message,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Import error:', error);
      let errorMessage = "Failed to import leads";
      
      if (error.message) {
        if (error.message.includes('foreign key')) {
          errorMessage = "Import failed: Invalid user reference in data";
        } else if (error.message.includes('duplicate key')) {
          errorMessage = "Import failed: Duplicate records found";
        } else if (error.message.includes('check constraint')) {
          errorMessage = "Import failed: Invalid data format";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Import Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      // Fetch leads with their action items
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_time', { ascending: false });

      if (leadsError) throw leadsError;

      if (!leads || leads.length === 0) {
        toast({
          title: "No Data",
          description: "No leads to export",
          variant: "destructive",
        });
        return;
      }

      // Fetch all action items for these leads
      const leadIds = leads.map(lead => lead.id);
      const { data: actionItems, error: actionItemsError } = await supabase
        .from('lead_action_items')
        .select('*')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });

      if (actionItemsError) {
        console.error('Error fetching action items:', actionItemsError);
        // Continue with export without action items
      }

      // Group action items by lead_id
      const actionItemsByLead = (actionItems || []).reduce((acc, item) => {
        if (!acc[item.lead_id]) {
          acc[item.lead_id] = [];
        }
        acc[item.lead_id].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      // Combine leads with their action items
      const leadsWithActionItems = leads.map(lead => ({
        ...lead,
        action_items_json: JSON.stringify(actionItemsByLead[lead.id] || [])
      }));

      const filename = getExportFilename('leads', 'all');
      const exporter = new GenericCSVExporter();
      await exporter.exportToCSV(leadsWithActionItems, filename, LEADS_EXPORT_FIELDS);

      toast({
        title: "Export Successful",
        description: `${leads.length} leads with action items exported`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: error.message || "Failed to export leads",
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

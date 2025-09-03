
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MeetingsCSVExporter } from '@/hooks/import-export/meetingsCSVExporter';
import { MeetingsCSVProcessor } from '@/hooks/import-export/meetingsCSVProcessor';

export const useMeetingsImportExport = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const exportMeetings = async () => {
    try {
      setIsProcessing(true);
      
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!meetings || meetings.length === 0) {
        toast({
          title: "No Data",
          description: "No meetings found to export",
          variant: "destructive",
        });
        return;
      }

      const exporter = new MeetingsCSVExporter();
      const timestamp = new Date().toISOString().split('T')[0];
      await exporter.exportToCSV(meetings, `meetings_export_${timestamp}.csv`);

      toast({
        title: "Export Successful",
        description: `Successfully exported ${meetings.length} meetings`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export meetings",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const importMeetings = async (csvText: string) => {
    try {
      setIsProcessing(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const processor = new MeetingsCSVProcessor();
      const result = await processor.processCSV(csvText, {
        userId: user.id,
        onProgress: (processed, total) => {
          console.log(`Progress: ${processed}/${total}`);
        }
      });

      if (result.successCount > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.successCount} meetings${result.updateCount > 0 ? `, updated ${result.updateCount}` : ''}${result.errorCount > 0 ? ` (${result.errorCount} errors)` : ''}`,
        });
      }

      if (result.errorCount > 0 && result.errors.length > 0) {
        console.error('Import errors:', result.errors);
        toast({
          title: "Import Errors",
          description: `${result.errorCount} rows failed to import. Check console for details.`,
          variant: "destructive",
        });
      }

      return result;

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import meetings",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    exportMeetings,
    importMeetings,
    isProcessing,
  };
};

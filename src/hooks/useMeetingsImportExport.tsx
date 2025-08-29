
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GenericCSVExporter } from '@/hooks/import-export/genericCSVExporter';
import { CSVParser } from '@/utils/csvParser';

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

      const fieldsOrder = [
        'title',
        'start_time',
        'end_time',
        'location',
        'agenda',
        'outcome',
        'next_action',
        'status',
        'priority',
        'participants',
        'teams_link',
        'lead_id',
        'contact_id',
        'deal_id',
        'tags',
        'follow_up_required',
        'host'
      ];

      const processedMeetings = meetings.map(meeting => ({
        title: meeting.title || '',
        start_time: meeting.start_datetime || '',
        end_time: meeting.end_datetime || '',
        location: 'Microsoft Teams',
        agenda: meeting.description || '',
        outcome: '',
        next_action: '',
        status: meeting.status || 'scheduled',
        priority: 'Medium',
        participants: Array.isArray(meeting.participants) ? meeting.participants.join(', ') : '',
        teams_link: meeting.teams_meeting_link || '',
        lead_id: '',
        contact_id: '',
        deal_id: '',
        tags: '',
        follow_up_required: false,
        host: meeting.organizer || ''
      }));

      const exporter = new GenericCSVExporter();
      const timestamp = new Date().toISOString().split('T')[0];
      await exporter.exportToCSV(processedMeetings, `meetings_export_${timestamp}.csv`, fieldsOrder);

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

      const { headers, rows } = CSVParser.parseCSV(csvText);
      
      if (rows.length === 0) {
        throw new Error('No data rows found in CSV');
      }

      const requiredFields = ['title', 'start_time', 'end_time'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const rowData: any = {};
          
          headers.forEach((header, index) => {
            rowData[header] = row[index] || '';
          });

          // Validate required fields
          if (!rowData.title?.trim()) {
            errors.push(`Row ${i + 1}: Missing title`);
            errorCount++;
            continue;
          }

          // Parse dates
          const startDateTime = new Date(rowData.start_time);
          const endDateTime = new Date(rowData.end_time);

          if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            errors.push(`Row ${i + 1}: Invalid date format`);
            errorCount++;
            continue;
          }

          if (endDateTime <= startDateTime) {
            errors.push(`Row ${i + 1}: End time must be after start time`);
            errorCount++;
            continue;
          }

          // Parse participants
          const participants = rowData.participants 
            ? rowData.participants.split(',').map((p: string) => p.trim()).filter((p: string) => p)
            : [];

          // Insert meeting
          const { error: insertError } = await supabase
            .from('meetings')
            .insert({
              title: rowData.title.trim(),
              start_datetime: startDateTime.toISOString(),
              end_datetime: endDateTime.toISOString(),
              participants,
              organizer: user.id,
              created_by: user.id,
              status: rowData.status === 'completed' ? 'Completed' : 
                     rowData.status === 'cancelled' ? 'Cancelled' : 'Scheduled',
              description: rowData.agenda || rowData.description || '',
            });

          if (insertError) {
            errors.push(`Row ${i + 1}: ${insertError.message}`);
            errorCount++;
          } else {
            successCount++;
          }

        } catch (rowError: any) {
          errors.push(`Row ${i + 1}: ${rowError.message}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${successCount} meetings${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
        });
      }

      if (errorCount > 0 && errors.length > 0) {
        console.error('Import errors:', errors);
        toast({
          title: "Import Errors",
          description: `${errorCount} rows failed to import. Check console for details.`,
          variant: "destructive",
        });
      }

      return { successCount, errorCount, errors };

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

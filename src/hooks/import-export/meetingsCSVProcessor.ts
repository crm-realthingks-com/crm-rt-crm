import { supabase } from '@/integrations/supabase/client';
import { CSVParser } from '@/utils/csvParser';
import { DateFormatUtils } from '@/utils/dateFormatUtils';

export interface MeetingsProcessingOptions {
  userId: string;
  onProgress?: (processed: number, total: number) => void;
}

export interface MeetingsProcessingResult {
  successCount: number;
  updateCount: number;
  errorCount: number;
  errors: string[];
}

export class MeetingsCSVProcessor {
  async processCSV(csvText: string, options: MeetingsProcessingOptions): Promise<MeetingsProcessingResult> {
    console.log('MeetingsCSVProcessor: Starting processing');
    
    try {
      const { headers, rows } = CSVParser.parseCSV(csvText);
      console.log(`MeetingsCSVProcessor: Parsed ${rows.length} rows with headers:`, headers);

      if (rows.length === 0) {
        throw new Error('No data rows found in CSV');
      }

      const result: MeetingsProcessingResult = {
        successCount: 0,
        updateCount: 0,
        errorCount: 0,
        errors: []
      };

      // Process rows in batches
      const batchSize = 20;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const batchResult = await this.processBatch(batch, headers, options, i);
        
        result.successCount += batchResult.successCount;
        result.updateCount += batchResult.updateCount;
        result.errorCount += batchResult.errorCount;
        result.errors.push(...batchResult.errors);

        if (options.onProgress) {
          options.onProgress(Math.min(i + batchSize, rows.length), rows.length);
        }
      }

      console.log('MeetingsCSVProcessor: Processing complete:', result);
      return result;

    } catch (error: any) {
      console.error('MeetingsCSVProcessor: Processing failed:', error);
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  private async processBatch(
    rows: string[][],
    headers: string[],
    options: MeetingsProcessingOptions,
    batchOffset: number
  ): Promise<MeetingsProcessingResult> {
    
    const result: MeetingsProcessingResult = {
      successCount: 0,
      updateCount: 0,
      errorCount: 0,
      errors: []
    };

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const actualRowNumber = batchOffset + rowIndex + 2; // +2 for header and 1-based indexing
      
      try {
        // Convert row to object
        const rowObj: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (row[index] !== undefined) {
            rowObj[header] = row[index];
          }
        });

        // Extract meeting action items if present
        let meetingActionItemsData: any[] = [];
        if (rowObj.meeting_action_items) {
          try {
            meetingActionItemsData = JSON.parse(rowObj.meeting_action_items);
            delete rowObj.meeting_action_items; // Remove from meeting data
          } catch (error) {
            console.warn('Failed to parse meeting action items JSON:', error);
          }
        }

        // Prepare meeting record
        const meetingRecord = this.prepareMeeting(rowObj, options.userId);

        // Validate required fields - ensure title is present and not empty
        if (!meetingRecord.title || meetingRecord.title.trim() === '') {
          result.errorCount++;
          result.errors.push(`Row ${actualRowNumber}: Meeting title is required and cannot be empty`);
          continue;
        }

        // Validate required datetime fields
        if (!meetingRecord.start_time_utc || !meetingRecord.end_time_utc) {
          result.errorCount++;
          result.errors.push(`Row ${actualRowNumber}: Both start_time_utc and end_time_utc are required`);
          continue;
        }

        let meetingId: string;
        let isUpdate = false;

        // Check for existing meeting by ID only (as per requirements)
        if (rowObj.id && rowObj.id.trim() !== '') {
          console.log('Checking for existing meeting with ID:', rowObj.id);
          const { data: existingMeeting } = await supabase
            .from('meetings')
            .select('id')
            .eq('id', rowObj.id.trim())
            .single();

          if (existingMeeting) {
            // Update existing meeting
            meetingId = existingMeeting.id;
            const { error: updateError } = await supabase
              .from('meetings')
              .update(meetingRecord)
              .eq('id', meetingId);

            if (updateError) {
              result.errorCount++;
              result.errors.push(`Row ${actualRowNumber}: Update failed - ${updateError.message}`);
              continue;
            }
            result.updateCount++;
            isUpdate = true;
            console.log('Updated existing meeting:', meetingId);
          } else {
            // Insert new meeting with provided ID
            const meetingToInsert = {
              id: rowObj.id.trim(),
              title: meetingRecord.title,
              ...meetingRecord
            };

            const { data: insertedMeeting, error: insertError } = await supabase
              .from('meetings')
              .insert([meetingToInsert])
              .select('id')
              .single();

            if (insertError) {
              result.errorCount++;
              result.errors.push(`Row ${actualRowNumber}: Insert failed - ${insertError.message}`);
              continue;
            }
            meetingId = insertedMeeting.id;
            result.successCount++;
            console.log('Inserted new meeting with ID:', meetingId);
          }
        } else {
          // Insert new meeting without ID (let database generate it)
          const meetingToInsert = {
            title: meetingRecord.title,
            ...meetingRecord
          };

          const { data: insertedMeeting, error: insertError } = await supabase
            .from('meetings')
            .insert([meetingToInsert])
            .select('id')
            .single();

          if (insertError) {
            result.errorCount++;
            result.errors.push(`Row ${actualRowNumber}: Insert failed - ${insertError.message}`);
            continue;
          }
          meetingId = insertedMeeting.id;
          result.successCount++;
          console.log('Inserted new meeting without ID:', meetingId);
        }

        // Process meeting action items if any
        if (meetingActionItemsData.length > 0) {
          await this.processMeetingActionItems(meetingId, meetingActionItemsData, options.userId, isUpdate);
        }

      } catch (error: any) {
        result.errorCount++;
        result.errors.push(`Row ${actualRowNumber}: Processing error - ${error.message}`);
      }
    }

    return result;
  }

  private prepareMeeting(rowObj: Record<string, any>, userId: string): Record<string, any> {
    const meetingRecord: Record<string, any> = {
      organizer: userId,
      created_by: userId,
      modified_by: userId
    };

    // Map CSV fields to database fields
    const fieldMapping: Record<string, string> = {
      'title': 'title',
      'participants': 'participants',
      'organizer': 'organizer',
      'status': 'status',
      'teams_meeting_link': 'teams_meeting_link',
      'teams_meeting_id': 'teams_meeting_id',
      'description': 'description',
      'created_by': 'created_by',
      'modified_by': 'modified_by',
      'duration': 'duration',
      'start_time_utc': 'start_time_utc',
      'end_time_utc': 'end_time_utc',
      'time_zone': 'time_zone',
      'microsoft_event_id': 'microsoft_event_id',
      'time_zone_display': 'time_zone_display'
    };

    Object.entries(fieldMapping).forEach(([csvField, dbField]) => {
      if (rowObj[csvField] !== undefined && rowObj[csvField] !== '') {
        meetingRecord[dbField] = rowObj[csvField];
      }
    });

    // Handle participants field - convert comma-separated string to array
    if (rowObj.participants && typeof rowObj.participants === 'string') {
      meetingRecord.participants = rowObj.participants.split(',').map((p: string) => p.trim()).filter((p: string) => p);
    }

    // Handle datetime fields
    const dateTimeFields = ['start_time_utc', 'end_time_utc', 'created_at', 'updated_at'];
    dateTimeFields.forEach(field => {
      if (rowObj[field] && rowObj[field].trim() !== '') {
        const date = new Date(rowObj[field]);
        if (!isNaN(date.getTime())) {
          meetingRecord[field] = date.toISOString();
        }
      }
    });

    // Handle numeric fields
    if (rowObj.duration && rowObj.duration !== '') {
      const num = parseInt(rowObj.duration);
      if (!isNaN(num)) meetingRecord.duration = num;
    }

    // Ensure required fields have defaults
    if (!meetingRecord.status) {
      meetingRecord.status = 'Scheduled';
    }

    if (!meetingRecord.time_zone) {
      meetingRecord.time_zone = 'UTC';
    }

    if (!meetingRecord.participants) {
      meetingRecord.participants = [];
    }

    return meetingRecord;
  }

  private async processMeetingActionItems(meetingId: string, actionItemsData: any[], userId: string, isUpdate: boolean = false) {
    try {
      // Clear existing action items only for updates to avoid conflicts
      if (isUpdate) {
        await supabase
          .from('meeting_action_items')
          .delete()
          .eq('meeting_id', meetingId);
      }

      // Insert new action items
      const actionItemsToInsert = actionItemsData.map(item => ({
        meeting_id: meetingId,
        next_action: item.next_action || '',
        status: item.status || 'Open',
        due_date: item.due_date || null,
        assigned_to: item.assigned_to || null,
        created_by: userId
      }));

      if (actionItemsToInsert.length > 0) {
        const { error } = await supabase
          .from('meeting_action_items')
          .insert(actionItemsToInsert);

        if (error) {
          console.error('Error inserting meeting action items:', error);
        } else {
          console.log(`Inserted ${actionItemsToInsert.length} action items for meeting ${meetingId}`);
        }
      }
    } catch (error) {
      console.error('Error processing meeting action items:', error);
    }
  }
}
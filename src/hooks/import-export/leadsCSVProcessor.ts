
import { supabase } from '@/integrations/supabase/client';
import { CSVParser } from '@/utils/csvParser';
import { DateFormatUtils } from '@/utils/dateFormatUtils';

export interface LeadsProcessingOptions {
  userId: string;
  onProgress?: (processed: number, total: number) => void;
}

export interface LeadsProcessingResult {
  successCount: number;
  updateCount: number;
  errorCount: number;
  errors: string[];
}

export class LeadsCSVProcessor {
  async processCSV(csvText: string, options: LeadsProcessingOptions): Promise<LeadsProcessingResult> {
    console.log('LeadsCSVProcessor: Starting processing');
    
    try {
      const { headers, rows } = CSVParser.parseCSV(csvText);
      console.log(`LeadsCSVProcessor: Parsed ${rows.length} rows with headers:`, headers);

      if (rows.length === 0) {
        throw new Error('No data rows found in CSV');
      }

      const result: LeadsProcessingResult = {
        successCount: 0,
        updateCount: 0,
        errorCount: 0,
        errors: []
      };

      // Process rows in batches
      const batchSize = 20;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const batchResult = await this.processBatch(batch, headers, options);
        
        result.successCount += batchResult.successCount;
        result.updateCount += batchResult.updateCount;
        result.errorCount += batchResult.errorCount;
        result.errors.push(...batchResult.errors);

        if (options.onProgress) {
          options.onProgress(Math.min(i + batchSize, rows.length), rows.length);
        }
      }

      console.log('LeadsCSVProcessor: Processing complete:', result);
      return result;

    } catch (error: any) {
      console.error('LeadsCSVProcessor: Processing failed:', error);
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  }

  private async processBatch(
    rows: string[][],
    headers: string[],
    options: LeadsProcessingOptions
  ): Promise<LeadsProcessingResult> {
    
    const result: LeadsProcessingResult = {
      successCount: 0,
      updateCount: 0,
      errorCount: 0,
      errors: []
    };

    for (const row of rows) {
      try {
        // Convert row to object
        const rowObj: Record<string, any> = {};
        headers.forEach((header, index) => {
          if (row[index] !== undefined) {
            rowObj[header] = row[index];
          }
        });

        // Extract action items if present
        let actionItemsData: any[] = [];
        if (rowObj.action_items_json) {
          try {
            actionItemsData = JSON.parse(rowObj.action_items_json);
            delete rowObj.action_items_json; // Remove from lead data
          } catch (error) {
            console.warn('Failed to parse action items JSON:', error);
          }
        }

        // Prepare lead record
        const leadRecord = this.prepareLead(rowObj, options.userId);

        // Validate required fields - ensure lead_name is present and not empty
        if (!leadRecord.lead_name || leadRecord.lead_name.trim() === '') {
          result.errorCount++;
          result.errors.push('Lead name is required');
          continue;
        }

        // Check for existing lead by name and company
        const { data: existingLeads } = await supabase
          .from('leads')
          .select('id')
          .eq('lead_name', leadRecord.lead_name)
          .eq('company_name', leadRecord.company_name || '');

        let leadId: string;

        if (existingLeads && existingLeads.length > 0) {
          // Update existing lead
          leadId = existingLeads[0].id;
          const { error: updateError } = await supabase
            .from('leads')
            .update(leadRecord)
            .eq('id', leadId);

          if (updateError) {
            result.errorCount++;
            result.errors.push(`Update failed: ${updateError.message}`);
            continue;
          }
          result.updateCount++;
        } else {
          // Insert new lead - ensure we have a proper lead record with all required fields
          const leadToInsert = {
            lead_name: leadRecord.lead_name, // Ensure this is always present
            company_name: leadRecord.company_name,
            position: leadRecord.position,
            email: leadRecord.email,
            phone_no: leadRecord.phone_no,
            linkedin: leadRecord.linkedin,
            website: leadRecord.website,
            contact_source: leadRecord.contact_source,
            lead_status: leadRecord.lead_status,
            industry: leadRecord.industry,
            country: leadRecord.country,
            description: leadRecord.description,
            contact_owner: leadRecord.contact_owner,
            created_by: leadRecord.created_by,
            modified_by: leadRecord.modified_by,
            created_time: leadRecord.created_time,
            modified_time: leadRecord.modified_time
          };

          const { data: insertedLead, error: insertError } = await supabase
            .from('leads')
            .insert([leadToInsert])
            .select('id')
            .single();

          if (insertError) {
            result.errorCount++;
            result.errors.push(`Insert failed: ${insertError.message}`);
            continue;
          }
          leadId = insertedLead.id;
          result.successCount++;
        }

        // Process action items if any
        if (actionItemsData.length > 0) {
          await this.processActionItems(leadId, actionItemsData, options.userId);
        }

      } catch (error: any) {
        result.errorCount++;
        result.errors.push(`Row processing error: ${error.message}`);
      }
    }

    return result;
  }

  private prepareLead(rowObj: Record<string, any>, userId: string): Record<string, any> {
    const leadRecord: Record<string, any> = {
      created_by: userId,
      modified_by: userId
    };

    // Map CSV fields to database fields
    const fieldMapping: Record<string, string> = {
      'lead_name': 'lead_name',
      'company_name': 'company_name',
      'position': 'position',
      'email': 'email',
      'phone_no': 'phone_no',
      'linkedin': 'linkedin',
      'website': 'website',
      'contact_source': 'contact_source',
      'lead_status': 'lead_status',
      'industry': 'industry',
      'country': 'country',
      'description': 'description',
      'contact_owner': 'contact_owner'
    };

    Object.entries(fieldMapping).forEach(([csvField, dbField]) => {
      if (rowObj[csvField] !== undefined && rowObj[csvField] !== '') {
        leadRecord[dbField] = rowObj[csvField];
      }
    });

    // Ensure lead_name is always set, even if empty from CSV
    if (!leadRecord.lead_name) {
      leadRecord.lead_name = rowObj.name || rowObj.contact_name || rowObj.full_name || '';
    }

    // Handle date fields
    if (rowObj.created_time) {
      const convertedDate = DateFormatUtils.convertDateForImport(rowObj.created_time);
      if (convertedDate) leadRecord.created_time = convertedDate;
    }

    if (rowObj.modified_time) {
      const convertedDate = DateFormatUtils.convertDateForImport(rowObj.modified_time);
      if (convertedDate) leadRecord.modified_time = convertedDate;
    }

    return leadRecord;
  }

  private async processActionItems(leadId: string, actionItemsData: any[], userId: string) {
    try {
      // Clear existing action items for this lead (optional - you might want to keep them)
      await supabase
        .from('lead_action_items')
        .delete()
        .eq('lead_id', leadId);

      // Insert new action items
      const actionItemsToInsert = actionItemsData.map(item => ({
        lead_id: leadId,
        next_action: item.next_action || '',
        status: item.status || 'Open',
        due_date: item.due_date || null,
        assigned_to: item.assigned_to || null,
        created_by: userId
      }));

      if (actionItemsToInsert.length > 0) {
        const { error } = await supabase
          .from('lead_action_items')
          .insert(actionItemsToInsert);

        if (error) {
          console.error('Error inserting action items:', error);
        } else {
          console.log(`Inserted ${actionItemsToInsert.length} action items for lead ${leadId}`);
        }
      }
    } catch (error) {
      console.error('Error processing action items:', error);
    }
  }
}

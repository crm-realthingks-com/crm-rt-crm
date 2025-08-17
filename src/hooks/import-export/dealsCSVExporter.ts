
import { GenericCSVExporter } from './genericCSVExporter';

// Exact field order as specified
const DEALS_EXPORT_FIELDS = [
  'id', 'deal_name', 'stage', 'probability', 'drop_reason', 'created_by', 'modified_by', 
  'created_at', 'modified_at', 'lead_name', 'lead_owner', 'project_name', 'customer_name', 
  'region', 'priority', 'internal_comment', 'expected_closing_date', 'customer_need', 
  'customer_challenges', 'relationship_strength', 'budget', 'business_value', 
  'decision_maker_level', 'is_recurring', 'start_date', 'end_date', 'currency_type', 
  'action_items', 'current_status', 'need_improvement', 'won_reason', 'lost_reason', 
  'total_contract_value', 'project_duration', 'quarterly_revenue_q1', 'quarterly_revenue_q2', 
  'quarterly_revenue_q3', 'quarterly_revenue_q4', 'total_revenue', 'closing', 
  'signed_contract_date', 'implementation_start_date', 'handoff_status', 
  'rfq_received_date', 'proposal_due_date', 'rfq_status'
];

export class DealsCSVExporter {
  private genericExporter: GenericCSVExporter;

  constructor() {
    this.genericExporter = new GenericCSVExporter();
  }
  
  async exportToCSV(deals: any[], filename: string) {
    console.log('DealsCSVExporter: Starting export with centralized logic');
    
    if (!deals || deals.length === 0) {
      throw new Error('No deals to export');
    }

    await this.genericExporter.exportToCSV(deals, filename, DEALS_EXPORT_FIELDS);
    console.log('DealsCSVExporter: Export completed successfully');
  }
}

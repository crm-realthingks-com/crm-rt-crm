import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LeadSearchableDropdown } from "@/components/LeadSearchableDropdown";
import { useUserDisplayNames } from "@/hooks/useUserDisplayNames";
import { useMemo } from "react";

interface FormFieldRendererProps {
  field: string;
  value: any;
  onChange: (field: string, value: any) => void;
  onLeadSelect?: (lead: any) => void;
  error?: string;
}

export const FormFieldRenderer = ({ field, value, onChange, onLeadSelect, error }: FormFieldRendererProps) => {
  const handleLeadSelect = (lead: any) => {
    // Update the lead name field
    onChange('lead_name', lead.lead_name);
    
    // Auto-populate other fields from the selected lead
    if (lead.company_name) {
      onChange('customer_name', lead.company_name);
    }
    if (lead.region) {
      onChange('region', lead.region);
    }
    if (lead.contact_owner) {
      onChange('lead_owner', lead.contact_owner);
    }
    
    // Store the original lead ID for historical tracking
    onChange('related_lead_id', lead.id);
    
    // Call the parent's onLeadSelect if provided
    if (onLeadSelect) {
      onLeadSelect(lead);
    }
  };

  const renderField = () => {
    switch (field) {
      case 'lead_name':
        return (
          <LeadSearchableDropdown
            value={value || ''}
            onValueChange={(leadName) => onChange(field, leadName)}
            onLeadSelect={handleLeadSelect}
            placeholder="Search and select a lead..."
          />
        );

      case 'lead_owner':
        // For lead_owner field, we need to display the user's display name
        return <LeadOwnerField value={value} onChange={onChange} field={field} />;

      case 'customer_name':
      case 'project_name':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder={`Enter ${field.replace('_', ' ')}`}
          />
        );

      case 'region':
        return (
          <Select value={value || ''} onValueChange={(newValue) => onChange(field, newValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EU">EU</SelectItem>
              <SelectItem value="US">US</SelectItem>
              <SelectItem value="Asia">Asia</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'priority':
        return (
          <Select value={value?.toString() || ''} onValueChange={(newValue) => onChange(field, parseInt(newValue))}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">High (1)</SelectItem>
              <SelectItem value="2">Medium (2)</SelectItem>
              <SelectItem value="3">Low (3)</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'internal_comment':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter internal comment"
          />
        );

      case 'customer_need':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter customer need"
          />
        );

      case 'customer_challenges':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter customer challenges"
          />
        );

      case 'relationship_strength':
        return (
          <Select value={value?.toString() || ''} onValueChange={(newValue) => onChange(field, parseInt(newValue))}>
            <SelectTrigger>
              <SelectValue placeholder="Select relationship strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Strong (1)</SelectItem>
              <SelectItem value="2">Good (2)</SelectItem>
              <SelectItem value="3">Weak (3)</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'budget':
        return (
          <Input
            type="number"
            value={value?.toString() || ''}
            onChange={(e) => onChange(field, parseFloat(e.target.value))}
            placeholder="Enter budget"
          />
        );

      case 'business_value':
        return (
          <Input
            type="number"
            value={value?.toString() || ''}
            onChange={(e) => onChange(field, parseFloat(e.target.value))}
            placeholder="Enter business value"
          />
        );

      case 'decision_maker_level':
        return (
          <Select value={value?.toString() || ''} onValueChange={(newValue) => onChange(field, parseInt(newValue))}>
            <SelectTrigger>
              <SelectValue placeholder="Select decision maker level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">High (1)</SelectItem>
              <SelectItem value="2">Medium (2)</SelectItem>
              <SelectItem value="3">Low (3)</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'is_recurring':
        return (
          <label className="flex items-center space-x-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => onChange(field, checked)}
            />
            <span>Is Recurring</span>
          </label>
        );

      case 'project_duration':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter project duration"
          />
        );

      case 'start_date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
          />
        );

      case 'end_date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
          />
        );

      case 'rfq_received_date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
          />
        );

      case 'proposal_due_date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
          />
        );

      case 'rfq_status':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter RFQ status"
          />
        );

      case 'currency_type':
        return (
          <Select value={value || ''} onValueChange={(newValue) => onChange(field, newValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'action_items':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter action items"
          />
        );

      case 'current_status':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter current status"
          />
        );

      case 'closing':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter closing details"
          />
        );

      case 'won_reason':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter reason for winning"
          />
        );

      case 'lost_reason':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter reason for losing"
          />
        );

      case 'need_improvement':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter areas for improvement"
          />
        );

      case 'drop_reason':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder="Enter reason for dropping"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder={`Enter ${field.replace('_', ' ')}`}
          />
        );
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      project_name: 'Project Name',
      lead_name: 'Lead Name',
      customer_name: 'Customer Name',
      region: 'Region',
      lead_owner: 'Lead Owner',
      priority: 'Priority',
      internal_comment: 'Internal Comment',
      customer_need: 'Customer Need',
      customer_challenges: 'Customer Challenges',
      relationship_strength: 'Relationship Strength',
      budget: 'Budget',
      business_value: 'Business Value',
      decision_maker_level: 'Decision Maker Level',
      is_recurring: 'Is Recurring',
      project_duration: 'Project Duration',
      start_date: 'Start Date',
      end_date: 'End Date',
      rfq_received_date: 'RFQ Received Date',
      proposal_due_date: 'Proposal Due Date',
      rfq_status: 'RFQ Status',
      currency_type: 'Currency Type',
      action_items: 'Action Items',
      current_status: 'Current Status',
      closing: 'Closing',
      won_reason: 'Won Reason',
      lost_reason: 'Lost Reason',
      need_improvement: 'Need Improvement',
      drop_reason: 'Drop Reason',
    };
    return labels[field] || field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {getFieldLabel(field)}
        {['project_name', 'lead_name', 'customer_name'].includes(field) && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      {renderField()}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Separate component for Lead Owner field to handle display names
const LeadOwnerField = ({ value, onChange, field }: { value: any, onChange: (field: string, value: any) => void, field: string }) => {
  const userIds = useMemo(() => value ? [value] : [], [value]);
  const { displayNames } = useUserDisplayNames(userIds);

  return (
    <Input
      type="text"
      value={value ? (displayNames[value] || 'Loading...') : ''}
      readOnly
      placeholder="Will be auto-filled when lead is selected"
      className="bg-gray-50"
    />
  );
};

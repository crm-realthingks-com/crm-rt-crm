
export type DealStage = 'Lead' | 'Discussions' | 'Qualified' | 'RFQ' | 'Offered' | 'Won' | 'Lost' | 'Dropped';
export type UserRole = 'Admin' | 'Manager' | 'User';
export type ContactSource = 'Website' | 'LinkedIn' | 'Referral' | 'Cold Call' | 'Email Campaign' | 'Trade Show' | 'Other';
export type IndustryType = 'Technology' | 'Healthcare' | 'Finance' | 'Manufacturing' | 'Retail' | 'Education' | 'Government' | 'Other';
export type RegionType = 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America' | 'Middle East' | 'Africa';

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_name: string;
  company?: string;
  position?: string;
  email?: string;
  contact_owner?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  source: ContactSource;
  industry: IndustryType;
  region: RegionType;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  user_id: string;
  lead_name: string;
  company_name?: string;
  lead_owner?: string;
  email?: string;
  phone_no?: string;
  source: ContactSource;
  industry: IndustryType;
  region: RegionType;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  deal_name: string;
  company_name?: string;
  lead_name?: string;
  lead_owner?: string;
  phone_no?: string;
  stage: DealStage;
  
  // Lead stage fields
  lead_source: ContactSource;
  lead_description?: string;
  
  // Discussions stage fields
  discussion_notes?: string;
  discussion_date?: string;
  next_follow_up?: string;
  
  // Qualified stage fields
  budget?: number;
  timeline?: string;
  decision_maker?: string;
  qualified_notes?: string;
  
  // RFQ stage fields
  rfq_sent_date?: string;
  rfq_deadline?: string;
  rfq_requirements?: string;
  
  // Offered stage fields
  offer_amount?: number;
  offer_date?: string;
  offer_valid_until?: string;
  offer_terms?: string;
  
  // Final stage fields
  close_date?: string;
  close_amount?: number;
  close_reason?: string;
  negotiation_status?: string;
  
  created_at: string;
  updated_at: string;
}

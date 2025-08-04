
export interface Contact {
  id: string;
  user_id: string;
  contact_name: string;
  company: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  website: string | null;
  source: 'Cold Call' | 'Email Campaign' | 'Social Media' | 'Referral' | 'Website' | 'Event' | 'Other';
  industry: 'Technology' | 'Healthcare' | 'Finance' | 'Manufacturing' | 'Retail' | 'Education' | 'Government' | 'Other';
  region: 'North America' | 'Europe' | 'Asia Pacific' | 'Latin America' | 'Middle East' | 'Africa';
  description: string | null;
  contact_owner: string | null;
  created_at: string;
  updated_at: string;
}

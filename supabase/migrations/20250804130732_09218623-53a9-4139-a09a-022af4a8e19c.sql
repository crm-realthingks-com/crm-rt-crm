
-- Create yearly_revenue_targets table
CREATE TABLE public.yearly_revenue_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  total_target NUMERIC NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on yearly_revenue_targets table
ALTER TABLE public.yearly_revenue_targets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for yearly_revenue_targets
CREATE POLICY "Users can view all yearly revenue targets" 
  ON public.yearly_revenue_targets 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create yearly revenue targets" 
  ON public.yearly_revenue_targets 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update yearly revenue targets" 
  ON public.yearly_revenue_targets 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete yearly revenue targets" 
  ON public.yearly_revenue_targets 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_yearly_revenue_targets_updated_at 
  BEFORE UPDATE ON public.yearly_revenue_targets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update deals table to add missing columns for revenue tracking
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS total_revenue NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS total_contract_value NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS quarterly_revenue_q1 NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS quarterly_revenue_q2 NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS quarterly_revenue_q3 NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS quarterly_revenue_q4 NUMERIC;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expected_closing_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS closing_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS signed_contract_date DATE;

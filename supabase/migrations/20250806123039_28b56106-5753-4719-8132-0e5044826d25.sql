
-- Create saved_deal_filters table for storing user filter preferences
CREATE TABLE public.saved_deal_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_deal_filters ENABLE ROW LEVEL SECURITY;

-- Create policies for saved filters
CREATE POLICY "Users can view their own saved filters" 
  ON public.saved_deal_filters 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved filters" 
  ON public.saved_deal_filters 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters" 
  ON public.saved_deal_filters 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters" 
  ON public.saved_deal_filters 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_deal_filters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_deal_filters_updated_at
  BEFORE UPDATE ON public.saved_deal_filters
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_deal_filters_updated_at();

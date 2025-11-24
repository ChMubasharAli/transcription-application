-- Create languages table
CREATE TABLE public.languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on languages table
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Create policies for languages
CREATE POLICY "Admins can manage languages" 
ON public.languages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view languages" 
ON public.languages 
FOR SELECT 
USING (true);

-- Add language_id column to domains table
ALTER TABLE public.domains 
ADD COLUMN language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE;

-- Insert default languages
INSERT INTO public.languages (name, code) VALUES 
('Hindi', 'hi'),
('Punjabi', 'pa'),
('Nepali', 'ne');

-- Create trigger for languages updated_at
CREATE TRIGGER update_languages_updated_at
BEFORE UPDATE ON public.languages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
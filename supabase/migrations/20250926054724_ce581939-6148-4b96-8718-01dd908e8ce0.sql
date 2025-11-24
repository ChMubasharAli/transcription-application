-- Create mock_tests table to store mock test configurations
CREATE TABLE public.mock_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  language_id UUID NOT NULL,
  dialogue1_id UUID NOT NULL,
  dialogue2_id UUID NOT NULL,
  difficulty TEXT,
  time_limit_minutes INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for mock tests
CREATE POLICY "Admins can manage mock tests" 
ON public.mock_tests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active mock tests" 
ON public.mock_tests 
FOR SELECT 
USING (is_active = true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_mock_tests_updated_at
BEFORE UPDATE ON public.mock_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_mock_tests_language_id ON public.mock_tests(language_id);
CREATE INDEX idx_mock_tests_active ON public.mock_tests(is_active);
CREATE INDEX idx_mock_tests_created_by ON public.mock_tests(created_by);
-- Create naati_attempts table for NAATI performance tracking
CREATE TABLE IF NOT EXISTS public.naati_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  week_start DATE NOT NULL, -- Monday of the attempt week (computed server-side)
  dialogue1_total SMALLINT CHECK (dialogue1_total >= 0 AND dialogue1_total <= 45),
  dialogue2_total SMALLINT CHECK (dialogue2_total >= 0 AND dialogue2_total <= 45),
  accuracy SMALLINT CHECK (accuracy >= 0 AND accuracy <= 20),
  fluency SMALLINT CHECK (fluency >= 0 AND fluency <= 10),
  pronunciation SMALLINT CHECK (pronunciation >= 0 AND pronunciation <= 7),
  register SMALLINT CHECK (register >= 0 AND register <= 5),
  consistency SMALLINT CHECK (consistency >= 0 AND consistency <= 3),
  language_code TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('full-test', 'practice')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.naati_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own NAATI attempts" 
ON public.naati_attempts 
FOR ALL 
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- Create indexes for performance
CREATE INDEX idx_naati_attempts_student_week ON public.naati_attempts(student_id, week_start);
CREATE INDEX idx_naati_attempts_student_date ON public.naati_attempts(student_id, attempt_at);
CREATE INDEX idx_naati_attempts_language ON public.naati_attempts(language_code);
CREATE INDEX idx_naati_attempts_test_type ON public.naati_attempts(test_type);

-- Create trigger for automatic week_start calculation
CREATE OR REPLACE FUNCTION public.calculate_week_start()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate Monday of the week for the attempt_at date
  NEW.week_start := DATE_TRUNC('week', NEW.attempt_at)::DATE + INTERVAL '1 day';
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_week_start
  BEFORE INSERT OR UPDATE ON public.naati_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_week_start();

-- Insert sample data for testing
INSERT INTO public.naati_attempts (
  student_id,
  attempt_at,
  dialogue1_total,
  dialogue2_total,
  accuracy,
  fluency,
  pronunciation,
  register,
  consistency,
  language_code,
  test_type
) VALUES 
  (
    '2ea63a47-b493-4705-83c8-4757e015fe15',
    now() - INTERVAL '3 days',
    38,
    35,
    16,
    8,
    6,
    4,
    3,
    'nepali',
    'practice'
  ),
  (
    '2ea63a47-b493-4705-83c8-4757e015fe15',
    now() - INTERVAL '10 days',
    32,
    31,
    14,
    7,
    5,
    3,
    2,
    'nepali',
    'practice'
  ),
  (
    '2ea63a47-b493-4705-83c8-4757e015fe15',
    now() - INTERVAL '17 days',
    28,
    30,
    12,
    6,
    4,
    3,
    2,
    'nepali',
    'full-test'
  );
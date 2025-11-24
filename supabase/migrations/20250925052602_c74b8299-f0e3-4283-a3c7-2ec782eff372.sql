-- Create practice_sessions table for tracking student practice time
CREATE TABLE public.practice_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE NULL,
  activity_type TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_practice_sessions_student_started ON public.practice_sessions (student_id, started_at);

-- Enable Row Level Security
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own practice sessions" 
ON public.practice_sessions 
FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Users can create their own practice sessions" 
ON public.practice_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own practice sessions" 
ON public.practice_sessions 
FOR UPDATE 
USING (auth.uid() = student_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_practice_sessions_updated_at
BEFORE UPDATE ON public.practice_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create storage bucket for exam audio responses
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-responses', 'exam-responses', false);

-- Create table for exam responses
CREATE TABLE public.exam_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  audio_file_path TEXT NOT NULL,
  transcript TEXT,
  duration_seconds INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on exam_responses
ALTER TABLE public.exam_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for exam_responses
CREATE POLICY "Users can view their own exam responses" 
ON public.exam_responses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exam responses" 
ON public.exam_responses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exam responses" 
ON public.exam_responses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create storage policies for exam-responses bucket
CREATE POLICY "Users can upload their own exam responses" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'exam-responses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own exam responses" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'exam-responses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own exam responses" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'exam-responses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exam_responses_updated_at
BEFORE UPDATE ON public.exam_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Update dialogue_segments table to include translation field (if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dialogue_segments' 
        AND column_name = 'translation'
    ) THEN
        ALTER TABLE public.dialogue_segments ADD COLUMN translation TEXT;
    END IF;
END $$;

-- Create user_audio_responses table for storing user responses and scores
CREATE TABLE IF NOT EXISTS public.user_audio_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    segment_id UUID NOT NULL REFERENCES public.dialogue_segments(id) ON DELETE CASCADE,
    audio_url TEXT,
    user_transcript TEXT,
    ai_scores JSONB,
    accuracy_score NUMERIC(4,2),
    register_score NUMERIC(4,2),
    content_quality_score NUMERIC(4,2),
    fluency_score NUMERIC(4,2),
    pronunciation_score NUMERIC(4,2),
    overall_score NUMERIC(4,2),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_audio_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for user_audio_responses
CREATE POLICY "Users can create their own audio responses" 
ON public.user_audio_responses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audio responses" 
ON public.user_audio_responses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio responses" 
ON public.user_audio_responses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_audio_responses_updated_at
BEFORE UPDATE ON public.user_audio_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
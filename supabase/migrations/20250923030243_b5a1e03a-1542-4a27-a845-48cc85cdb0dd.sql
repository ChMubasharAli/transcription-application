-- Create user_test_sessions table (complete test attempts)
CREATE TABLE public.user_test_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dialogue_id UUID NOT NULL REFERENCES public.dialogues(id) ON DELETE CASCADE,
  target_language_id UUID NOT NULL REFERENCES public.languages(id),
  session_type TEXT NOT NULL DEFAULT 'practice', -- 'practice' or 'mock_test'
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  total_segments INTEGER NOT NULL DEFAULT 0,
  completed_segments INTEGER NOT NULL DEFAULT 0,
  total_score DECIMAL(5,2), -- overall AI score (0-100)
  time_limit_seconds INTEGER NOT NULL DEFAULT 1200, -- 20 minutes = 1200 seconds
  time_spent_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_segment_responses table (individual segment responses + AI scores)
CREATE TABLE public.user_segment_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.user_test_sessions(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES public.dialogue_segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1, -- for retries
  audio_response_url TEXT, -- path to user's recorded response
  transcribed_text TEXT, -- AI transcription of user's response
  translation_accuracy_score DECIMAL(5,2), -- AI score for translation accuracy (0-100)
  fluency_score DECIMAL(5,2), -- AI score for fluency (0-100)
  grammar_score DECIMAL(5,2), -- AI score for grammar (0-100)
  overall_score DECIMAL(5,2), -- combined AI score (0-100)
  ai_feedback TEXT, -- detailed AI feedback
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, segment_id, attempt_number)
);

-- Enable Row Level Security on new tables
ALTER TABLE public.user_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segment_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for user-specific data
CREATE POLICY "Users can manage their own test sessions" ON public.user_test_sessions 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own responses" ON public.user_segment_responses 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_user_test_sessions_updated_at
  BEFORE UPDATE ON public.user_test_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_segment_responses_updated_at
  BEFORE UPDATE ON public.user_segment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
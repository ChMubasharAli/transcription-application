-- Create languages table for different target languages (Punjabi, Hindi, Nepali, etc.)
CREATE TABLE public.languages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., "Punjabi", "Hindi", "Nepali"
  code TEXT NOT NULL, -- e.g., "pa", "hi", "ne"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create domains table (categories like Business, Medical, Legal)
CREATE TABLE public.domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT, -- for UI theming
  difficulty TEXT, -- beginner, intermediate, advanced
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dialogues table (practice conversations within domains)
CREATE TABLE public.dialogues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  language_id UUID REFERENCES public.languages(id),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT, -- beginner, intermediate, advanced
  duration TEXT, -- estimated time like "10 minutes"
  participants TEXT, -- who's in the dialogue (e.g., "Patient and Doctor")
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dialogue_segments table (individual audio pieces with red line timing)
CREATE TABLE public.dialogue_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dialogue_id UUID NOT NULL REFERENCES public.dialogues(id) ON DELETE CASCADE,
  segment_order INTEGER NOT NULL, -- order in the dialogue
  audio_url TEXT, -- path to audio file in Supabase storage
  text_content TEXT, -- English text to be translated
  speaker TEXT, -- who's speaking (e.g., "Patient", "Doctor")
  start_time DOUBLE PRECISION, -- when red line appears (in seconds)
  end_time DOUBLE PRECISION, -- when recording should end
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

-- Create announcements table for admin notifications
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for user notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'announcement', 'score_ready', 'new_content', etc.
  content_id UUID, -- reference to related content (dialogue, domain, etc.)
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vocabulary table for language learning support
CREATE TABLE public.vocabulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_id UUID REFERENCES public.languages(id),
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  audio_url TEXT, -- pronunciation audio
  category TEXT, -- medical, business, legal terms
  difficulty_level TEXT, -- beginner, intermediate, advanced
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rapid_review table for quick practice questions
CREATE TABLE public.rapid_review (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_id UUID REFERENCES public.languages(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT, -- grammar, vocabulary, cultural context
  difficulty TEXT, -- beginner, intermediate, advanced
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogue_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_segment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rapid_review ENABLE ROW LEVEL SECURITY;

-- Create policies for content viewing (everyone can see practice content)
CREATE POLICY "Users can view languages" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Users can view domains" ON public.domains FOR SELECT USING (true);
CREATE POLICY "Users can view dialogues" ON public.dialogues FOR SELECT USING (true);
CREATE POLICY "Users can view dialogue segments" ON public.dialogue_segments FOR SELECT USING (true);
CREATE POLICY "Users can view vocabulary" ON public.vocabulary FOR SELECT USING (true);
CREATE POLICY "Users can view rapid review" ON public.rapid_review FOR SELECT USING (true);
CREATE POLICY "Users can view active announcements" ON public.announcements FOR SELECT USING (active = true);

-- Create policies for user-specific data
CREATE POLICY "Users can manage their own test sessions" ON public.user_test_sessions 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own responses" ON public.user_segment_responses 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create admin policies (assuming admin role system exists)
CREATE POLICY "Admins can manage languages" ON public.languages 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage domains" ON public.domains 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage dialogues" ON public.dialogues 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage dialogue segments" ON public.dialogue_segments 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage announcements" ON public.announcements 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage vocabulary" ON public.vocabulary 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage rapid review" ON public.rapid_review 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dialogues_updated_at
  BEFORE UPDATE ON public.dialogues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dialogue_segments_updated_at
  BEFORE UPDATE ON public.dialogue_segments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_test_sessions_updated_at
  BEFORE UPDATE ON public.user_test_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_segment_responses_updated_at
  BEFORE UPDATE ON public.user_segment_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vocabulary_updated_at
  BEFORE UPDATE ON public.vocabulary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rapid_review_updated_at
  BEFORE UPDATE ON public.rapid_review
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create notification trigger function
CREATE OR REPLACE FUNCTION public.notify_all_users()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  user_record RECORD;
BEGIN
  -- Determine notification content based on table
  CASE TG_TABLE_NAME
    WHEN 'announcements' THEN
      notification_title := 'New Announcement';
      notification_message := 'A new announcement has been posted: ' || NEW.title;
      notification_type := 'announcement';
    WHEN 'domains' THEN
      notification_title := 'New Domain Added';
      notification_message := 'A new practice domain is available: ' || NEW.title;
      notification_type := 'domain';
    WHEN 'dialogues' THEN
      notification_title := 'New Dialogue Added';
      notification_message := 'A new dialogue is available: ' || NEW.title;
      notification_type := 'dialogue';
    WHEN 'vocabulary' THEN
      notification_title := 'New Vocabulary Added';
      notification_message := 'New vocabulary word added: ' || NEW.word;
      notification_type := 'vocabulary';
    WHEN 'rapid_review' THEN
      notification_title := 'New Rapid Review Question';
      notification_message := 'New rapid review question added';
      notification_type := 'rapid_review';
    ELSE
      RETURN NEW;
  END CASE;

  -- Insert notification for all users
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    )
  LOOP
    INSERT INTO public.notifications (
      title, 
      message, 
      type, 
      content_id, 
      user_id
    ) VALUES (
      notification_title,
      notification_message,
      notification_type,
      NEW.id,
      user_record.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for notifications
CREATE TRIGGER notify_new_announcement
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

CREATE TRIGGER notify_new_domain
  AFTER INSERT ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

CREATE TRIGGER notify_new_dialogue
  AFTER INSERT ON public.dialogues
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

CREATE TRIGGER notify_new_vocabulary
  AFTER INSERT ON public.vocabulary
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

CREATE TRIGGER notify_new_rapid_review
  AFTER INSERT ON public.rapid_review
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

-- Insert sample languages
INSERT INTO public.languages (name, code) VALUES 
  ('Punjabi', 'pa'),
  ('Hindi', 'hi'),
  ('Nepali', 'ne'),
  ('Urdu', 'ur'),
  ('Bengali', 'bn'),
  ('Tamil', 'ta'),
  ('Telugu', 'te'),
  ('Gujarati', 'gu'),
  ('Marathi', 'mr'),
  ('Malayalam', 'ml');

-- Insert sample domains
INSERT INTO public.domains (title, description, color, difficulty) VALUES 
  ('Business', 'Corporate meetings, negotiations, and professional conversations', '#3B82F6', 'intermediate'),
  ('Medical', 'Doctor-patient consultations and medical terminology', '#EF4444', 'advanced'),
  ('Legal', 'Court proceedings, legal consultations, and legal terminology', '#8B5CF6', 'advanced'),
  ('Education', 'Parent-teacher meetings, academic discussions', '#10B981', 'beginner'),
  ('Government Services', 'Social services, immigration, and public sector interactions', '#F59E0B', 'intermediate'),
  ('Community Services', 'Social work, community support, and public services', '#EC4899', 'beginner');
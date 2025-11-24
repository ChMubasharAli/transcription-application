-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'announcement', 'domain', 'dialogue', 'vocabulary', 'rapid_review'
  content_id UUID, -- Reference to the created content
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to notify all users
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

-- Create triggers for all content tables
CREATE TRIGGER notify_users_on_announcement_insert
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

CREATE TRIGGER notify_users_on_domain_insert
  AFTER INSERT ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

CREATE TRIGGER notify_users_on_dialogue_insert
  AFTER INSERT ON public.dialogues
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

CREATE TRIGGER notify_users_on_vocabulary_insert
  AFTER INSERT ON public.vocabulary
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

CREATE TRIGGER notify_users_on_rapid_review_insert
  AFTER INSERT ON public.rapid_review
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_all_users();

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.notifications;
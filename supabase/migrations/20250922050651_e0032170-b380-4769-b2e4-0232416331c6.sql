-- Create storage bucket for dialogue audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('dialogue-audio', 'dialogue-audio', false);

-- Create RLS policies for dialogue audio uploads
CREATE POLICY "Admins can upload dialogue audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'dialogue-audio' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view dialogue audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'dialogue-audio' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update dialogue audio files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'dialogue-audio' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete dialogue audio files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'dialogue-audio' AND has_role(auth.uid(), 'admin'::app_role));
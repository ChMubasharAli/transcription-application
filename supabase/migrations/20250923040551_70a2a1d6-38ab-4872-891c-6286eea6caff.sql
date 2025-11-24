-- Create storage policies for dialogue-audio bucket
CREATE POLICY "Users can view dialogue audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'dialogue-audio');

CREATE POLICY "Admins can manage dialogue audio files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'dialogue-audio' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'dialogue-audio' AND has_role(auth.uid(), 'admin'::app_role));
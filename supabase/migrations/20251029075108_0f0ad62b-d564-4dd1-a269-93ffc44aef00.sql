-- Create audio bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for audio bucket
CREATE POLICY "Anyone can view audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Admins can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update audio files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete audio files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);
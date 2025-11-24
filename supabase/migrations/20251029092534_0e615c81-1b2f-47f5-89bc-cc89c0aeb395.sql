-- Create storage policies for audio uploads in vocabulary

-- Allow authenticated users (admins) to upload audio files
CREATE POLICY "Allow authenticated uploads to audio bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio');

-- Allow authenticated users to read audio files
CREATE POLICY "Allow public read access to audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to audio bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'audio');

-- Allow authenticated users to delete audio files
CREATE POLICY "Allow authenticated deletes from audio bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'audio');
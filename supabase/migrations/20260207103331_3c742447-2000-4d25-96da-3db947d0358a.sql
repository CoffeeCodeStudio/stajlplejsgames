-- Make the klotter storage bucket private instead of public
UPDATE storage.buckets 
SET public = false 
WHERE id = 'klotter';

-- Drop the old public access policy
DROP POLICY IF EXISTS "Klotter images are publicly accessible" ON storage.objects;

-- Authenticated users can view klotter images (needed for signed URLs)
DROP POLICY IF EXISTS "Auth users can read klotter images" ON storage.objects;
CREATE POLICY "Auth users can read klotter images"
ON storage.objects FOR SELECT
USING (bucket_id = 'klotter' AND auth.uid() IS NOT NULL);

-- Users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload their own klotter images" ON storage.objects;
CREATE POLICY "Users can upload their own klotter images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'klotter' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own klotter images  
DROP POLICY IF EXISTS "Users can delete their own klotter images" ON storage.objects;
CREATE POLICY "Users can delete their own klotter images"
ON storage.objects FOR DELETE
USING (bucket_id = 'klotter' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);

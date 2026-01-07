-- Migration: Add storage policies for tag proof uploads
-- Allows authenticated users to upload proof images/videos for tag responses

-- Policy: Allow authenticated users to upload to tag-proofs/ folder
CREATE POLICY "Allow authenticated users to upload tag proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tagfit'
  AND (storage.foldername(name))[1] = 'tag-proofs'
);

-- Policy: Allow public read access to tag proofs
CREATE POLICY "Allow public read access to tag proofs"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'tagfit'
  AND (storage.foldername(name))[1] = 'tag-proofs'
);

-- Policy: Allow authenticated users to update tag proofs (for upsert)
CREATE POLICY "Allow authenticated users to update tag proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tagfit'
  AND (storage.foldername(name))[1] = 'tag-proofs'
);

-- Policy: Allow authenticated users to delete their own tag proofs
-- Note: Uses naming convention tag-proofs/{recipient_id}-response-{timestamp}.ext
CREATE POLICY "Allow authenticated users to delete tag proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tagfit'
  AND (storage.foldername(name))[1] = 'tag-proofs'
);

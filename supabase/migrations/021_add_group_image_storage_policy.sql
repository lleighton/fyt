-- Add storage policies to allow group image uploads
-- The 'tagfit' bucket should already exist

-- Policy: Allow authenticated users to upload to groups/ folder
CREATE POLICY "Allow authenticated users to upload group images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tagfit'
  AND (storage.foldername(name))[1] = 'groups'
);

-- Policy: Allow public read access to group images
CREATE POLICY "Allow public read access to group images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'tagfit'
  AND (storage.foldername(name))[1] = 'groups'
);

-- Policy: Allow authenticated users to update group images (for upsert)
CREATE POLICY "Allow authenticated users to update group images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tagfit'
  AND (storage.foldername(name))[1] = 'groups'
);

-- Policy: Allow authenticated users to delete group images
CREATE POLICY "Allow authenticated users to delete group images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tagfit'
  AND (storage.foldername(name))[1] = 'groups'
);

CREATE POLICY "own site photos read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'site-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own site photos insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own site photos update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own site photos delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
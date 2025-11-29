-- Storage setup for Supabase

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create game-assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-assets', 'game-assets', true);

-- RLS Policies for avatars bucket
CREATE POLICY "Users can upload an avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can read avatars"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'avatars');

-- RLS Policies for game-assets bucket
CREATE POLICY "Admins can upload game assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game-assets' 
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.subscription_type = 'admin'
  )
);

CREATE POLICY "Anyone can read game assets"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'game-assets');
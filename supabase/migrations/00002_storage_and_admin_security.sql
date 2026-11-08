-- ==============================================================================
-- 00002_storage_and_admin_security.sql
-- FATHY GEO CODE Platform Enhancements:
-- 1. Add email column to profiles & sync from auth.users
-- 2. Create Storage Buckets: 'course-images' and 'platform-assets'
-- 3. Storage RLS Policies: Public read, Admin-only write/delete
-- 4. Unpublish sample courses and sample testimonials so real admin content shows
-- ==============================================================================

-- 1. ADD EMAIL TO PROFILES & UPDATE TRIGGER
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with emails from auth.users
DO $$
BEGIN
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
EXCEPTION WHEN OTHERS THEN
  -- In case auth.users access has different permission in certain contexts
  NULL;
END $$;

-- Update handle_new_user trigger to populate email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN NEW.email = 'ahmedtarbo98@gmail.com' THEN 'admin'::user_role 
      ELSE 'student'::user_role 
    END,
    COALESCE(NEW.raw_user_meta_data->>'language', 'ar')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$;

-- 2. CREATE SUPABASE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'course-images', 
    'course-images', 
    true, 
    2097152, -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  ),
  (
    'platform-assets', 
    'platform-assets', 
    true, 
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. STORAGE RLS POLICIES
-- Public Read Access for 'course-images' and 'platform-assets'
CREATE POLICY "Public can view course-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('course-images', 'platform-assets'));

-- Admin Only Insert/Update/Delete for 'course-images' and 'platform-assets'
CREATE POLICY "Admins can upload to course-images and platform-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('course-images', 'platform-assets') 
    AND (public.is_admin(auth.uid()) OR auth.email() = 'ahmedtarbo98@gmail.com')
  );

CREATE POLICY "Admins can update files in course-images and platform-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('course-images', 'platform-assets') 
    AND (public.is_admin(auth.uid()) OR auth.email() = 'ahmedtarbo98@gmail.com')
  );

CREATE POLICY "Admins can delete files in course-images and platform-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('course-images', 'platform-assets') 
    AND (public.is_admin(auth.uid()) OR auth.email() = 'ahmedtarbo98@gmail.com')
  );

-- 4. UNPUBLISH SAMPLE SEED DATA (Set sample courses to 'draft' and testimonials to 'is_published=false' so only real data displays)
UPDATE public.courses
SET status = 'draft'
WHERE id IN (
  'c1111111-1111-1111-1111-111111111111',
  'c2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333'
);

UPDATE public.testimonials
SET is_published = false
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

-- ==============================================================================
-- FATHY GEO CODE — TESTIMONIALS & COMMUNITY REVIEWS SYSTEM
-- Extends existing public.testimonials table safely and idempotently.
-- Run this migration in Supabase SQL Editor.
-- ==============================================================================

-- 0. ENSURE ADMIN HELPER FUNCTIONS EXIST
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND role::text = 'admin'
      AND COALESCE(is_blocked, false) = false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_admin(auth.uid());
$$;

-- 1. EXTEND EXISTING TESTIMONIALS TABLE
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW());

-- Ensure status check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'testimonials_status_check'
  ) THEN
    ALTER TABLE public.testimonials
      ADD CONSTRAINT testimonials_status_check
      CHECK (status IN ('pending', 'published', 'hidden'));
  END IF;
END $$;

-- Ensure media_type check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'testimonials_media_type_check'
  ) THEN
    ALTER TABLE public.testimonials
      ADD CONSTRAINT testimonials_media_type_check
      CHECK (media_type IS NULL OR media_type IN ('image', 'video'));
  END IF;
END $$;

-- Ensure rating range 1..5
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'testimonials_rating_range_check'
  ) THEN
    ALTER TABLE public.testimonials
      ADD CONSTRAINT testimonials_rating_range_check
      CHECK (rating >= 1 AND rating <= 5);
  END IF;
END $$;

-- Sync status for any existing rows
UPDATE public.testimonials
SET status = CASE WHEN is_published THEN 'published' ELSE 'hidden' END
WHERE status = 'pending' AND is_published = true;

-- Default is_published to false for new submissions unless explicitly published by admin
ALTER TABLE public.testimonials
  ALTER COLUMN is_published SET DEFAULT false;

-- 2. INDEXES FOR FAST QUERIES & SORTING
CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials (status);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured_order ON public.testimonials (is_featured DESC, order_index ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_course_id ON public.testimonials (course_id);

-- 3. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.set_testimonials_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_testimonials_updated_at ON public.testimonials;
CREATE TRIGGER trg_testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_testimonials_updated_at();

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published testimonials are publicly readable" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;

CREATE POLICY "Published testimonials are publicly readable"
  ON public.testimonials FOR SELECT
  TO public
  USING (status = 'published' OR is_published = true OR public.is_current_admin());

CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

-- 5. STORAGE BUCKET FOR TESTIMONIAL MEDIA (Avatars & Optional Images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimonial-media',
  'testimonial-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

DROP POLICY IF EXISTS "Public can view testimonial media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload testimonial media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update testimonial media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete testimonial media" ON storage.objects;

CREATE POLICY "Public can view testimonial media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'testimonial-media');

CREATE POLICY "Admins can upload testimonial media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'testimonial-media' AND public.is_current_admin());

CREATE POLICY "Admins can update testimonial media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'testimonial-media' AND public.is_current_admin())
  WITH CHECK (bucket_id = 'testimonial-media' AND public.is_current_admin());

CREATE POLICY "Admins can delete testimonial media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonial-media' AND public.is_current_admin());

-- 6. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

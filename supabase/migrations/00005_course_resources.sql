-- ==============================================================================
-- FATHY GEO CODE — COURSE-WIDE RESOURCES & GEOGRAPHIC DATASETS
-- Review before running in Supabase SQL Editor.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  resource_type resource_type DEFAULT 'file'::resource_type NOT NULL,
  file_url TEXT,
  external_url TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_resources_course_id
  ON public.course_resources (course_id, order_index);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.course_resources TO postgres, anon, authenticated, service_role;

ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled students and free courses can read course resources" ON public.course_resources;
DROP POLICY IF EXISTS "Admins can manage all course resources" ON public.course_resources;

CREATE POLICY "Enrolled students and free courses can read course resources"
  ON public.course_resources FOR SELECT
  TO public
  USING (
    public.is_current_admin()
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_resources.course_id
        AND c.is_free = true
        AND c.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = course_resources.course_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
    )
  );

CREATE POLICY "Admins can manage all course resources"
  ON public.course_resources FOR ALL
  TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

NOTIFY pgrst, 'reload schema';

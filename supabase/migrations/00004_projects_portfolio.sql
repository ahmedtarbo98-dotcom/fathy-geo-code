-- ==============================================================================
-- FATHY GEO CODE — PROJECTS PORTFOLIO TABLES, RLS, INDEXES & STORAGE BUCKET
-- Review carefully before running in Supabase SQL Editor.
-- ==============================================================================

-- 1. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  short_description_ar TEXT NOT NULL DEFAULT '',
  short_description_en TEXT NOT NULL DEFAULT '',
  details_ar TEXT NOT NULL DEFAULT '',
  details_en TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'GIS',
  client_name TEXT,
  location TEXT,
  project_date TEXT,
  tools TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 2. PROJECT MEDIA TABLE (Gallery images + YouTube video links)
CREATE TABLE IF NOT EXISTS public.project_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  caption_ar TEXT DEFAULT '',
  caption_en TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects (slug);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON public.projects (is_published);
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON public.projects (sort_order);
CREATE INDEX IF NOT EXISTS idx_project_media_project_id ON public.project_media (project_id);

-- 4. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.set_projects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_projects_updated_at();

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;

CREATE POLICY "Public can read published projects"
  ON public.projects FOR SELECT
  TO public
  USING (is_published = true OR public.is_current_admin());

CREATE POLICY "Admins can manage all projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

DROP POLICY IF EXISTS "Public can read media of published projects" ON public.project_media;
DROP POLICY IF EXISTS "Admins can manage all project media" ON public.project_media;

CREATE POLICY "Public can read media of published projects"
  ON public.project_media FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_media.project_id
        AND (p.is_published = true OR public.is_current_admin())
    )
  );

CREATE POLICY "Admins can manage all project media"
  ON public.project_media FOR ALL
  TO authenticated
  USING (public.is_current_admin())
  WITH CHECK (public.is_current_admin());

-- 6. STORAGE BUCKET: project-images (Public read, Admin-only write, max 3 MB, jpg/png/webp)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

DROP POLICY IF EXISTS "Public can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update project images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete project images" ON storage.objects;

CREATE POLICY "Public can view project images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'project-images');

CREATE POLICY "Admins can upload project images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-images' AND public.is_current_admin());

CREATE POLICY "Admins can update project images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-images' AND public.is_current_admin())
  WITH CHECK (bucket_id = 'project-images' AND public.is_current_admin());

CREATE POLICY "Admins can delete project images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-images' AND public.is_current_admin());

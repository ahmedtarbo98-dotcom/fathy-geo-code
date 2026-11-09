-- ==============================================================================
-- FATHY GEO CODE — COMPLETE DATABASE SETUP SCRIPT
-- Execute this script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yddozdcdhnnblgxcwjet/sql/new
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('active', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE video_provider AS ENUM ('youtube', 'bunny', 'vimeo');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('file', 'link');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'student'::user_role NOT NULL,
  language TEXT DEFAULT 'ar' NOT NULL,
  phone TEXT,
  is_blocked BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Admin security check functions
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin' AND is_blocked = false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_admin(auth.uid()) OR auth.jwt() ->> 'email' = 'ahmedtarbo98@gmail.com';
$$;

-- Trigger to create profile when new user registers
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth users to profiles
DO $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    email,
    CASE WHEN email = 'ahmedtarbo98@gmail.com' THEN 'admin'::user_role ELSE 'student'::user_role END
  FROM auth.users
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'ahmedtarbo98@gmail.com' THEN 'admin'::user_role ELSE profiles.role END;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ==============================================================================
-- 4. COURSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  short_description_ar TEXT NOT NULL DEFAULT '',
  short_description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  what_you_will_learn_ar JSONB DEFAULT '[]'::jsonb NOT NULL,
  what_you_will_learn_en JSONB DEFAULT '[]'::jsonb NOT NULL,
  requirements_ar JSONB DEFAULT '[]'::jsonb NOT NULL,
  requirements_en JSONB DEFAULT '[]'::jsonb NOT NULL,
  thumbnail_url TEXT DEFAULT '/logo.jpg',
  category TEXT DEFAULT 'GIS & Mapping' NOT NULL,
  level course_level DEFAULT 'all_levels'::course_level NOT NULL,
  is_free BOOLEAN DEFAULT true NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  status course_status DEFAULT 'draft'::course_status NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 5. COURSE SECTIONS & LESSONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  duration_seconds INTEGER DEFAULT 0 NOT NULL,
  is_free_preview BOOLEAN DEFAULT false NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Protected lesson videos (YouTube IDs, Bunny, Vimeo)
CREATE TABLE IF NOT EXISTS public.lesson_videos (
  lesson_id UUID PRIMARY KEY REFERENCES public.lessons(id) ON DELETE CASCADE,
  provider video_provider DEFAULT 'youtube'::video_provider NOT NULL,
  video_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Lesson Resources (External Links, Drive URLs, PDFs, Data)
CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  resource_type resource_type DEFAULT 'link'::resource_type NOT NULL,
  file_url TEXT,
  external_url TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 6. ENROLLMENTS & REQUESTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status enrollment_status DEFAULT 'active'::enrollment_status NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status request_status DEFAULT 'pending'::request_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false NOT NULL,
  watched_seconds INTEGER DEFAULT 0 NOT NULL,
  last_position_seconds INTEGER DEFAULT 0 NOT NULL,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- ==============================================================================
-- 7. QUIZZES & CERTIFICATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID UNIQUE NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  passing_score INTEGER DEFAULT 70 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_ar TEXT NOT NULL,
  question_en TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INTEGER NOT NULL,
  explanation_ar TEXT,
  explanation_en TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score NUMERIC(5, 2) NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  course_title_ar TEXT NOT NULL,
  course_title_en TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  revoked BOOLEAN DEFAULT false NOT NULL,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, course_id)
);

-- ==============================================================================
-- 8. TESTIMONIALS & SITE SETTINGS & CONTACT
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name_ar TEXT NOT NULL,
  student_name_en TEXT NOT NULL,
  student_title_ar TEXT NOT NULL,
  student_title_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  rating INTEGER DEFAULT 5 NOT NULL,
  avatar_url TEXT,
  is_published BOOLEAN DEFAULT true NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 9. INITIAL SITE SETTINGS
-- ==============================================================================
INSERT INTO public.site_settings (key, value, description)
VALUES 
  (
    'platform_stats', 
    '{"manual_override": false, "students_count": 1500, "courses_count": 14, "hours_count": 160, "projects_count": 45, "satisfaction_rate": 99}'::jsonb,
    'Platform statistics displayed on the hero stats strip'
  ),
  (
    'instructor_profile',
    '{"name_ar": "م. أحمد فتحي", "name_en": "Eng. Ahmed Fathy", "title_ar": "مهندس ومطور نظم معلومات جغرافية واستشعار عن بعد", "title_en": "GIS & Remote Sensing Engineer & Developer", "bio_ar": "مهندس استشاري ومطور نظم معلومات جغرافية معتمد، يمتلك خبرة واسعة في تحليل البيانات المكانية، البرمجة الجغرافية، والمسح الجوي والفضائي.", "bio_en": "Consultant Engineer and certified GIS Developer with extensive experience in spatial analysis, geospatial programming, and remote sensing.", "avatar_url": "/logo.jpg"}'::jsonb,
    'Instructor profile and biography'
  ),
  (
    'site_identity',
    '{"site_name": "FATHY GEO CODE", "tagline_ar": "المنصة التعليمية الرائدة في نظم المعلومات الجغرافية والاستشعار عن بعد", "tagline_en": "The Premier Hub for GIS & Remote Sensing Education", "logo_url": "/logo.jpg"}'::jsonb,
    'Site branding and identity settings'
  )
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid collision
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;

DROP POLICY IF EXISTS "Published courses are publicly readable" ON public.courses;
DROP POLICY IF EXISTS "Admins have full access to courses" ON public.courses;

DROP POLICY IF EXISTS "Sections readable if course is published" ON public.course_sections;
DROP POLICY IF EXISTS "Admins have full access to sections" ON public.course_sections;

DROP POLICY IF EXISTS "Lessons readable if course is published" ON public.lessons;
DROP POLICY IF EXISTS "Admins have full access to lessons" ON public.lessons;

DROP POLICY IF EXISTS "Only admins can select lesson videos directly" ON public.lesson_videos;
DROP POLICY IF EXISTS "Only admins can insert/update/delete lesson videos" ON public.lesson_videos;

DROP POLICY IF EXISTS "Enrolled students and preview lessons can read resources" ON public.lesson_resources;
DROP POLICY IF EXISTS "Admins have full access to resources" ON public.lesson_resources;

DROP POLICY IF EXISTS "Students can read own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can auto-enroll in free courses" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;

DROP POLICY IF EXISTS "Students can read and create own enrollment requests" ON public.enrollment_requests;
DROP POLICY IF EXISTS "Students can submit enrollment requests" ON public.enrollment_requests;
DROP POLICY IF EXISTS "Admins can manage enrollment requests" ON public.enrollment_requests;

DROP POLICY IF EXISTS "Users can read own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert/update own progress" ON public.lesson_progress;

DROP POLICY IF EXISTS "Anyone can verify valid certificates by ID" ON public.certificates;
DROP POLICY IF EXISTS "Admins can issue/revoke certificates" ON public.certificates;

DROP POLICY IF EXISTS "Published testimonials are publicly readable" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;

DROP POLICY IF EXISTS "Site settings are publicly readable" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

DROP POLICY IF EXISTS "Anyone can send a contact message" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can read contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can manage contact messages" ON public.contact_messages;

-- PROFILES
CREATE POLICY "Public profiles are readable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_current_admin());

-- COURSES
CREATE POLICY "Published courses are publicly readable"
  ON public.courses FOR SELECT TO public
  USING (status = 'published' OR public.is_current_admin());

CREATE POLICY "Admins have full access to courses"
  ON public.courses FOR ALL TO authenticated
  USING (public.is_current_admin());

-- COURSE SECTIONS
CREATE POLICY "Sections readable if course is published"
  ON public.course_sections FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.courses WHERE courses.id = course_sections.course_id AND (courses.status = 'published' OR public.is_current_admin())
    )
  );

CREATE POLICY "Admins have full access to sections"
  ON public.course_sections FOR ALL TO authenticated
  USING (public.is_current_admin());

-- LESSONS
CREATE POLICY "Lessons readable if course is published"
  ON public.lessons FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.courses WHERE courses.id = lessons.course_id AND (courses.status = 'published' OR public.is_current_admin())
    )
  );

CREATE POLICY "Admins have full access to lessons"
  ON public.lessons FOR ALL TO authenticated
  USING (public.is_current_admin());

-- LESSON VIDEOS (Admin only direct access; student access via Edge Function or secure player)
CREATE POLICY "Only admins can select lesson videos directly"
  ON public.lesson_videos FOR SELECT TO authenticated
  USING (public.is_current_admin());

CREATE POLICY "Only admins can insert/update/delete lesson videos"
  ON public.lesson_videos FOR ALL TO authenticated
  USING (public.is_current_admin());

-- LESSON RESOURCES
CREATE POLICY "Enrolled students and preview lessons can read resources"
  ON public.lesson_resources FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons WHERE lessons.id = lesson_resources.lesson_id AND lessons.is_free_preview = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id = lesson_resources.lesson_id AND e.user_id = auth.uid() AND e.status = 'active'
    )
    OR public.is_current_admin()
  );

CREATE POLICY "Admins have full access to resources"
  ON public.lesson_resources FOR ALL TO authenticated
  USING (public.is_current_admin());

-- ENROLLMENTS
CREATE POLICY "Students can read own enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_admin());

CREATE POLICY "Students can auto-enroll in free courses"
  ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.courses WHERE courses.id = course_id AND courses.is_free = true AND courses.status = 'published'
    )
  );

CREATE POLICY "Admins can manage all enrollments"
  ON public.enrollments FOR ALL TO authenticated
  USING (public.is_current_admin());

-- ENROLLMENT REQUESTS
CREATE POLICY "Students can read and create own enrollment requests"
  ON public.enrollment_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_admin());

CREATE POLICY "Students can submit enrollment requests"
  ON public.enrollment_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollment requests"
  ON public.enrollment_requests FOR ALL TO authenticated
  USING (public.is_current_admin());

-- LESSON PROGRESS
CREATE POLICY "Users can read own progress"
  ON public.lesson_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_current_admin());

CREATE POLICY "Users can insert/update own progress"
  ON public.lesson_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_current_admin())
  WITH CHECK (auth.uid() = user_id);

-- CERTIFICATES
CREATE POLICY "Anyone can verify valid certificates by ID"
  ON public.certificates FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can issue/revoke certificates"
  ON public.certificates FOR ALL TO authenticated
  USING (public.is_current_admin());

-- TESTIMONIALS
CREATE POLICY "Published testimonials are publicly readable"
  ON public.testimonials FOR SELECT TO public
  USING (is_published = true OR public.is_current_admin());

CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL TO authenticated
  USING (public.is_current_admin());

-- SITE SETTINGS
CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.is_current_admin());

-- CONTACT MESSAGES
CREATE POLICY "Anyone can send a contact message"
  ON public.contact_messages FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Only admins can read contact messages"
  ON public.contact_messages FOR SELECT TO authenticated
  USING (public.is_current_admin());

CREATE POLICY "Only admins can manage contact messages"
  ON public.contact_messages FOR ALL TO authenticated
  USING (public.is_current_admin());

-- ==============================================================================
-- 11. STORAGE BUCKETS SETUP
-- ==============================================================================
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

DROP POLICY IF EXISTS "Public can view course-images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to course-images and platform-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update files in course-images and platform-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete files in course-images and platform-assets" ON storage.objects;

CREATE POLICY "Public can view course-images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id IN ('course-images', 'platform-assets'));

CREATE POLICY "Admins can upload to course-images and platform-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('course-images', 'platform-assets'));

CREATE POLICY "Admins can update files in course-images and platform-assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('course-images', 'platform-assets'));

CREATE POLICY "Admins can delete files in course-images and platform-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('course-images', 'platform-assets'));

-- ==============================================================================
-- 12. FORCE SCHEMA CACHE RELOAD
-- ==============================================================================
NOTIFY pgrst, 'reload schema';

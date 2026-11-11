-- ==============================================================================
-- FATHY GEO CODE — LIVE DATABASE STATS, PRIVACY RLS & CLEANUP MIGRATION
-- Review every statement before running in Supabase SQL Editor.
-- ==============================================================================

-- 1. TIGHTEN PROFILES PRIVACY RLS
-- Prevent students from reading other users' emails/profiles while letting admins read all.
DROP POLICY IF EXISTS "Public profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_current_admin());

-- Ensure video_access_logs & user_sessions have strict RLS policies
DROP POLICY IF EXISTS "Admins can read all video access logs" ON public.video_access_logs;
DROP POLICY IF EXISTS "Users can insert own video access logs" ON public.video_access_logs;
DROP POLICY IF EXISTS "Users can read own video access logs" ON public.video_access_logs;

CREATE POLICY "Admins can read all video access logs"
  ON public.video_access_logs FOR SELECT
  TO authenticated
  USING (public.is_current_admin());

CREATE POLICY "Users can insert own video access logs"
  ON public.video_access_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own video access logs"
  ON public.video_access_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and admins can manage own sessions" ON public.user_sessions;
CREATE POLICY "Users and admins can manage own sessions"
  ON public.user_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.is_current_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_current_admin());


-- 2. SAFE PUBLIC STATS RPC (NO PERSONAL DATA)
-- Returns ONLY aggregate integer/numeric counts for the public Home page.
CREATE OR REPLACE FUNCTION public.get_public_platform_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_students_count INTEGER := 0;
  v_courses_count INTEGER := 0;
  v_lessons_count INTEGER := 0;
  v_duration_seconds BIGINT := 0;
  v_total_hours NUMERIC(10, 1) := 0;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO v_students_count
  FROM public.profiles
  WHERE role = 'student';

  SELECT COUNT(*)::INTEGER
  INTO v_courses_count
  FROM public.courses
  WHERE status = 'published';

  SELECT
    COUNT(l.id)::INTEGER,
    COALESCE(SUM(GREATEST(l.duration_seconds, 0)), 0)::BIGINT
  INTO v_lessons_count, v_duration_seconds
  FROM public.lessons l
  INNER JOIN public.courses c ON c.id = l.course_id
  WHERE c.status = 'published';

  v_total_hours := ROUND((v_duration_seconds::NUMERIC / 3600.0), 1);

  RETURN jsonb_build_object(
    'students_count', COALESCE(v_students_count, 0),
    'published_courses_count', COALESCE(v_courses_count, 0),
    'published_lessons_count', COALESCE(v_lessons_count, 0),
    'total_duration_seconds', COALESCE(v_duration_seconds, 0),
    'total_hours', COALESCE(v_total_hours, 0),
    'computed_at_utc', TIMEZONE('utc', NOW())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_stats() TO anon, authenticated;


-- 3. ADMIN DASHBOARD METRICS RPC (DB-SIDE AGGREGATION IN UTC)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_utc_today DATE := (TIMEZONE('utc', NOW()))::DATE;
  v_total_students INTEGER := 0;
  v_blocked_students INTEGER := 0;
  v_new_signups_7d INTEGER := 0;
  v_new_signups_30d INTEGER := 0;
  v_active_enrollments INTEGER := 0;
  v_total_enrollments INTEGER := 0;
  v_completed_enrollments INTEGER := 0;
  v_completion_rate NUMERIC(5, 1) := 0;
  v_total_courses INTEGER := 0;
  v_published_courses INTEGER := 0;
  v_total_lessons INTEGER := 0;
  v_pending_requests INTEGER := 0;
  v_unread_messages INTEGER := 0;
  v_daily_signups JSONB := '[]'::JSONB;
  v_most_watched_courses JSONB := '[]'::JSONB;
  v_most_watched_lessons JSONB := '[]'::JSONB;
BEGIN
  IF NOT public.is_current_admin() THEN
    RAISE EXCEPTION 'Forbidden: Admin access required';
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE is_blocked = true)::INTEGER,
    COUNT(*) FILTER (WHERE created_at >= (TIMEZONE('utc', NOW()) - INTERVAL '7 days'))::INTEGER,
    COUNT(*) FILTER (WHERE created_at >= (TIMEZONE('utc', NOW()) - INTERVAL '30 days'))::INTEGER
  INTO
    v_total_students,
    v_blocked_students,
    v_new_signups_7d,
    v_new_signups_30d
  FROM public.profiles
  WHERE role = 'student';

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW()))::INTEGER
  INTO v_total_enrollments, v_active_enrollments
  FROM public.enrollments;

  -- Completion rate: enrollments where student completed 100% of lessons in that course / total enrollments
  WITH course_lesson_totals AS (
    SELECT course_id, COUNT(*)::INTEGER AS lesson_count
    FROM public.lessons
    GROUP BY course_id
  ),
  user_course_completions AS (
    SELECT user_id, course_id, COUNT(*) FILTER (WHERE completed = true)::INTEGER AS completed_count
    FROM public.lesson_progress
    GROUP BY user_id, course_id
  )
  SELECT COUNT(*)::INTEGER
  INTO v_completed_enrollments
  FROM public.enrollments e
  INNER JOIN course_lesson_totals clt ON clt.course_id = e.course_id
  LEFT JOIN user_course_completions ucc ON ucc.user_id = e.user_id AND ucc.course_id = e.course_id
  WHERE clt.lesson_count > 0 AND COALESCE(ucc.completed_count, 0) >= clt.lesson_count;

  v_completion_rate := CASE
    WHEN v_total_enrollments = 0 THEN 0
    ELSE ROUND((v_completed_enrollments::NUMERIC / v_total_enrollments::NUMERIC) * 100.0, 1)
  END;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'published')::INTEGER
  INTO v_total_courses, v_published_courses
  FROM public.courses;

  SELECT COUNT(*)::INTEGER INTO v_total_lessons FROM public.lessons;
  SELECT COUNT(*)::INTEGER INTO v_pending_requests FROM public.enrollment_requests WHERE status = 'pending';
  SELECT COUNT(*)::INTEGER INTO v_unread_messages FROM public.contact_messages WHERE is_read = false;

  -- 30-day UTC daily signup series (days with zero signups explicitly show 0)
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', TO_CHAR(d.day, 'YYYY-MM-DD'),
        'count', COALESCE(s.cnt, 0)
      )
      ORDER BY d.day ASC
    ),
    '[]'::JSONB
  )
  INTO v_daily_signups
  FROM generate_series(v_utc_today - INTERVAL '29 days', v_utc_today, INTERVAL '1 day') AS d(day)
  LEFT JOIN (
    SELECT (created_at AT TIME ZONE 'UTC')::DATE AS signup_day, COUNT(*)::INTEGER AS cnt
    FROM public.profiles
    WHERE role = 'student'
      AND (created_at AT TIME ZONE 'UTC')::DATE >= (v_utc_today - INTERVAL '29 days')
    GROUP BY 1
  ) s ON s.signup_day = d.day::DATE;

  -- Most-watched courses (combining video_access_logs & lesson_progress)
  SELECT COALESCE(
    jsonb_agg(row_to_json(t)),
    '[]'::JSONB
  )
  INTO v_most_watched_courses
  FROM (
    SELECT
      c.id,
      c.title_ar,
      c.title_en,
      c.slug,
      COUNT(DISTINCT lp.id) FILTER (WHERE lp.watched_seconds > 0 OR lp.completed = true)::INTEGER AS progress_views,
      COUNT(DISTINCT val.id)::INTEGER AS access_views,
      COUNT(DISTINCT COALESCE(lp.user_id, val.user_id))::INTEGER AS unique_learners,
      COUNT(DISTINCT lp.id) FILTER (WHERE lp.completed = true)::INTEGER AS completed_records,
      (COUNT(DISTINCT val.id) + COUNT(DISTINCT lp.id) FILTER (WHERE lp.watched_seconds > 0 OR lp.completed = true))::INTEGER AS total_views
    FROM public.courses c
    LEFT JOIN public.lessons l ON l.course_id = c.id
    LEFT JOIN public.lesson_progress lp ON lp.lesson_id = l.id
    LEFT JOIN public.video_access_logs val ON val.lesson_id = l.id
    GROUP BY c.id, c.title_ar, c.title_en, c.slug
    HAVING (COUNT(DISTINCT val.id) + COUNT(DISTINCT lp.id) FILTER (WHERE lp.watched_seconds > 0 OR lp.completed = true)) > 0
    ORDER BY total_views DESC, unique_learners DESC
    LIMIT 5
  ) t;

  -- Most-watched lessons (combining video_access_logs & lesson_progress)
  SELECT COALESCE(
    jsonb_agg(row_to_json(t)),
    '[]'::JSONB
  )
  INTO v_most_watched_lessons
  FROM (
    SELECT
      l.id,
      l.title_ar,
      l.title_en,
      c.id AS course_id,
      c.title_ar AS course_title_ar,
      c.title_en AS course_title_en,
      COUNT(DISTINCT val.id)::INTEGER AS access_views,
      COUNT(DISTINCT lp.id) FILTER (WHERE lp.watched_seconds > 0 OR lp.completed = true)::INTEGER AS learner_interactions,
      COUNT(DISTINCT lp.id) FILTER (WHERE lp.completed = true)::INTEGER AS completions,
      GREATEST(COUNT(DISTINCT val.id), COUNT(DISTINCT lp.id) FILTER (WHERE lp.watched_seconds > 0 OR lp.completed = true))::INTEGER AS total_views
    FROM public.lessons l
    INNER JOIN public.courses c ON c.id = l.course_id
    LEFT JOIN public.lesson_progress lp ON lp.lesson_id = l.id
    LEFT JOIN public.video_access_logs val ON val.lesson_id = l.id
    GROUP BY l.id, l.title_ar, l.title_en, c.id, c.title_ar, c.title_en
    HAVING GREATEST(COUNT(DISTINCT val.id), COUNT(DISTINCT lp.id) FILTER (WHERE lp.watched_seconds > 0 OR lp.completed = true)) > 0
    ORDER BY total_views DESC, completions DESC
    LIMIT 5
  ) t;

  RETURN jsonb_build_object(
    'total_students', v_total_students,
    'blocked_students', v_blocked_students,
    'new_signups_7d', v_new_signups_7d,
    'new_signups_30d', v_new_signups_30d,
    'active_enrollments', v_active_enrollments,
    'total_enrollments', v_total_enrollments,
    'completed_enrollments', v_completed_enrollments,
    'completion_rate', v_completion_rate,
    'total_courses', v_total_courses,
    'published_courses', v_published_courses,
    'total_lessons', v_total_lessons,
    'pending_requests_count', v_pending_requests,
    'unread_messages_count', v_unread_messages,
    'daily_signups_30d', v_daily_signups,
    'most_watched_courses', v_most_watched_courses,
    'most_watched_lessons', v_most_watched_lessons,
    'computed_at_utc', TIMEZONE('utc', NOW())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_metrics() TO authenticated;


-- 4. CLEANUP SEEDED / SAMPLE FAKE DATA
-- Safe cleanup: preserves ahmedtarbo98@gmail.com and all real courses.

-- 4a. Delete seeded fake testimonials
DELETE FROM public.testimonials
WHERE id IN (
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333'
);

-- 4b. Delete seeded sample draft courses ONLY (never touches real courses)
DELETE FROM public.courses
WHERE id IN (
  'c1111111-1111-1111-1111-111111111111',
  'c2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333'
)
AND status = 'draft';

-- 4c. Delete fake demo student accounts & their cascaded enrollments (protects admin)
DELETE FROM auth.users
WHERE email <> 'ahmedtarbo98@gmail.com'
  AND (email ILIKE '%@example.com' OR email ILIKE '%@fathygeocode.com');

-- 4d. Delete any sample contact messages or demo certificates using example emails
DELETE FROM public.contact_messages
WHERE email ILIKE '%@example.com' OR email ILIKE '%@fathygeocode.com';

DELETE FROM public.certificates
WHERE id IN ('FGC-2026-ARCGIS', 'FGC-2026-PYTHON', 'FGC-2026-DEMO');

-- 4e. Reset site_settings platform_stats so live DB counts are used (overrides OFF by default)
INSERT INTO public.site_settings (key, value, description)
VALUES (
  'platform_stats',
  jsonb_build_object(
    'show_stats_strip', true,
    'use_manual_overrides', false,
    'students', null,
    'courses', null,
    'lessons', null,
    'hours', null
  ),
  'Homepage stats strip visibility and optional manual overrides (default OFF to use live DB stats)'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = TIMEZONE('utc', NOW());

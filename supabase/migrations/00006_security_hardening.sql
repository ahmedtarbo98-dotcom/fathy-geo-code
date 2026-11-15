-- ==============================================================================
-- 00006_security_hardening.sql
-- FATHY GEO CODE PLATFORM — COMPREHENSIVE SECURITY & SCALABILITY HARDENING PASS
-- Review every statement before executing in Supabase SQL Editor.
-- ==============================================================================

-- 1. PREVENT PRIVILEGE ESCALATION ON PROFILES TABLE
-- Even if an authenticated user attempts to update their own role or unblock themselves,
-- this BEFORE UPDATE trigger guarantees that role & is_blocked can ONLY be modified
-- by confirmed administrators or the backend service role.

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If attempting to alter role or is_blocked
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.is_blocked IS DISTINCT FROM NEW.is_blocked) THEN
    -- Check if current execution context is admin or service_role
    IF NOT public.is_current_admin() AND current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
      RAISE EXCEPTION 'Security Violation: Only platform administrators can change user roles or status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- Ensure profiles RLS is strictly configured
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ==============================================================================
-- 2. QUIZ & ASSESSMENT SYSTEM SECURITY (PREVENT ANSWER LEAKS)
-- ==============================================================================

-- Ensure RLS is enabled on quizzes & quiz_questions
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Admins have full access to quizzes and questions
DROP POLICY IF EXISTS "Admins have full access to quizzes" ON public.quizzes;
CREATE POLICY "Admins have full access to quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (public.is_current_admin());

DROP POLICY IF EXISTS "Enrolled students can view active quizzes" ON public.quizzes;
CREATE POLICY "Enrolled students can view active quizzes"
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      public.is_current_admin()
      OR EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id = quizzes.course_id
          AND e.user_id = auth.uid()
          AND e.status = 'active'
          AND (e.expires_at IS NULL OR e.expires_at > NOW())
      )
      OR EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = quizzes.course_id
          AND c.is_free = true
          AND c.status = 'published'
      )
    )
  );

-- Admins only can select quiz_questions directly to prevent students inspecting correct answers
DROP POLICY IF EXISTS "Admins have full access to quiz questions" ON public.quiz_questions;
CREATE POLICY "Admins have full access to quiz questions"
  ON public.quiz_questions FOR ALL
  TO authenticated
  USING (public.is_current_admin());

-- Secure RPC to fetch quiz questions for a student (EXCLUDES correct_option_index and explanations)
CREATE OR REPLACE FUNCTION public.get_student_quiz_questions(p_quiz_id UUID)
RETURNS TABLE (
  id UUID,
  quiz_id UUID,
  question_ar TEXT,
  question_en TEXT,
  options JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller has access to this quiz
  IF NOT EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = p_quiz_id
      AND q.is_active = true
      AND (
        public.is_current_admin()
        OR EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.course_id = q.course_id
            AND e.user_id = auth.uid()
            AND e.status = 'active'
        )
        OR EXISTS (
          SELECT 1 FROM public.courses c
          WHERE c.id = q.course_id
            AND c.is_free = true
        )
      )
  ) THEN
    RAISE EXCEPTION 'Access denied to this quiz.';
  END IF;

  RETURN QUERY
  SELECT
    qq.id,
    qq.quiz_id,
    qq.question_ar,
    qq.question_en,
    qq.options
  FROM public.quiz_questions qq
  WHERE qq.quiz_id = p_quiz_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_student_quiz_questions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_student_quiz_questions(UUID) TO authenticated;

-- Quiz attempts RLS
DROP POLICY IF EXISTS "Students can read own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students can read own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_current_admin());

DROP POLICY IF EXISTS "Students can record own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Students can record own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 3. AUDIT LOGGING FOR ADMINISTRATIVE ACTIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb NOT NULL,
  ip_address TEXT DEFAULT '127.0.0.1' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Only admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_current_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_admin());

-- Immutable: Prevent updates or deletes on audit logs
REVOKE UPDATE, DELETE ON public.admin_audit_logs FROM authenticated, anon;


-- ==============================================================================
-- 4. PERFORMANCE & HIGH-CONCURRENCY INDEXES (1,000+ CONCURRENT USERS)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status 
  ON public.enrollments (user_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_status 
  ON public.enrollments (course_id, status);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson 
  ON public.lesson_progress (user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_user 
  ON public.lesson_progress (course_id, user_id);

CREATE INDEX IF NOT EXISTS idx_lessons_course_order 
  ON public.lessons (course_id, order_index);

CREATE INDEX IF NOT EXISTS idx_courses_status_is_free 
  ON public.courses (status, is_free);

CREATE INDEX IF NOT EXISTS idx_certificates_user 
  ON public.certificates (user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_code 
  ON public.certificates (verification_code);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.profiles (email);

CREATE INDEX IF NOT EXISTS idx_profiles_role_blocked 
  ON public.profiles (role, is_blocked);

CREATE INDEX IF NOT EXISTS idx_video_access_logs_user_date 
  ON public.video_access_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status 
  ON public.enrollment_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at 
  ON public.admin_audit_logs (created_at DESC);

NOTIFY pgrst, 'reload schema';

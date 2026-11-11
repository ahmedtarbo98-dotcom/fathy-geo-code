import { createAdminClient } from "@/lib/supabase/admin";

export interface PublicPlatformStats {
  studentsCount: number;
  publishedCoursesCount: number;
  publishedLessonsCount: number;
  totalHours: number;
  showStatsStrip: boolean;
  useManualOverrides: boolean;
  computedAtUtc: string | null;
}

interface RawPlatformStatsSetting {
  show_stats_strip?: boolean;
  use_manual_overrides?: boolean;
  students?: number | string | null;
  courses?: number | string | null;
  lessons?: number | string | null;
  hours?: number | string | null;
}

const DEFAULT_PUBLIC_STATS: PublicPlatformStats = {
  studentsCount: 0,
  publishedCoursesCount: 0,
  publishedLessonsCount: 0,
  totalHours: 0,
  showStatsStrip: true,
  useManualOverrides: false,
  computedAtUtc: null,
};

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

async function computeLiveCountsFallback(): Promise<{
  studentsCount: number;
  publishedCoursesCount: number;
  publishedLessonsCount: number;
  totalHours: number;
  computedAtUtc: string;
}> {
  const admin = createAdminClient();

  const [studentsRes, coursesRes] = await Promise.all([
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student"),
    admin
      .from("courses")
      .select("id")
      .eq("status", "published"),
  ]);

  const publishedCourseIds = (coursesRes.data || []).map((c: { id: string }) => c.id);
  let lessonsCount = 0;
  let totalDurationSeconds = 0;

  if (publishedCourseIds.length > 0) {
    const { data: lessonRows } = await admin
      .from("lessons")
      .select("duration_seconds")
      .in("course_id", publishedCourseIds);

    lessonsCount = lessonRows?.length || 0;
    totalDurationSeconds = (lessonRows || []).reduce(
      (sum: number, row: { duration_seconds: number | null }) =>
        sum + Math.max(Number(row.duration_seconds) || 0, 0),
      0
    );
  }

  return {
    studentsCount: studentsRes.count ?? 0,
    publishedCoursesCount: publishedCourseIds.length,
    publishedLessonsCount: lessonsCount,
    totalHours: Math.round((totalDurationSeconds / 3600) * 10) / 10,
    computedAtUtc: new Date().toISOString(),
  };
}

export async function getPublicPlatformStats(): Promise<PublicPlatformStats> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || supabaseUrl.includes("placeholder-project")) {
    return DEFAULT_PUBLIC_STATS;
  }

  try {
    const [rpcRes, settingRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/rpc/get_public_platform_stats`, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        next: {
          tags: ["public-stats"],
          revalidate: 300,
        },
        signal: AbortSignal.timeout(4000),
      }),
      fetch(
        `${supabaseUrl}/rest/v1/site_settings?select=value&key=eq.platform_stats`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          next: {
            tags: ["public-stats"],
            revalidate: 300,
          },
          signal: AbortSignal.timeout(4000),
        }
      ),
    ]);

    let studentsCount = 0;
    let publishedCoursesCount = 0;
    let publishedLessonsCount = 0;
    let totalHours = 0;
    let computedAtUtc: string | null = null;

    if (rpcRes.ok) {
      const rpcData = await rpcRes.json();
      studentsCount = Number(rpcData?.students_count) || 0;
      publishedCoursesCount = Number(rpcData?.published_courses_count) || 0;
      publishedLessonsCount = Number(rpcData?.published_lessons_count) || 0;
      totalHours = Number(rpcData?.total_hours) || 0;
      computedAtUtc = rpcData?.computed_at_utc || new Date().toISOString();
    } else {
      const fallback = await computeLiveCountsFallback();
      studentsCount = fallback.studentsCount;
      publishedCoursesCount = fallback.publishedCoursesCount;
      publishedLessonsCount = fallback.publishedLessonsCount;
      totalHours = fallback.totalHours;
      computedAtUtc = fallback.computedAtUtc;
    }

    let setting: RawPlatformStatsSetting | null = null;
    if (settingRes.ok) {
      const rows: Array<{ value: RawPlatformStatsSetting }> = await settingRes.json();
      setting = rows?.[0]?.value || null;
    }

    const showStatsStrip = setting?.show_stats_strip !== false;
    const useManualOverrides = setting?.use_manual_overrides === true;

    if (useManualOverrides && setting) {
      const manualStudents = parseOptionalNumber(setting.students);
      const manualCourses = parseOptionalNumber(setting.courses);
      const manualLessons = parseOptionalNumber(setting.lessons);
      const manualHours = parseOptionalNumber(setting.hours);

      if (manualStudents !== null) studentsCount = manualStudents;
      if (manualCourses !== null) publishedCoursesCount = manualCourses;
      if (manualLessons !== null) publishedLessonsCount = manualLessons;
      if (manualHours !== null) totalHours = manualHours;
    }

    return {
      studentsCount,
      publishedCoursesCount,
      publishedLessonsCount,
      totalHours,
      showStatsStrip,
      useManualOverrides,
      computedAtUtc,
    };
  } catch {
    try {
      const fallback = await computeLiveCountsFallback();
      return {
        ...fallback,
        showStatsStrip: true,
        useManualOverrides: false,
      };
    } catch {
      return DEFAULT_PUBLIC_STATS;
    }
  }
}

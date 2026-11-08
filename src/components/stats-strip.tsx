"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Users, BookOpen, Clock, Briefcase, Award } from "lucide-react";

interface StatItem {
  icon: any;
  target: number;
  suffix: string;
  labelKey: string;
}

export default function StatsStrip({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("Stats");
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const supabase = createClient();

  const [liveStats, setLiveStats] = useState({
    students: 1,
    courses: 1,
    hours: 10,
    projects: 15,
    satisfaction: 99,
  });

  useEffect(() => {
    async function fetchPlatformStats() {
      try {
        // 1. Check for admin override in site_settings
        const { data: settingsRow } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "platform_stats")
          .single();

        let override = settingsRow?.value;

        // 2. Fetch real counts from DB
        const [{ count: studentCount }, { count: courseCount }, { data: lessonsData }] =
          await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase
              .from("courses")
              .select("*", { count: "exact", head: true })
              .eq("status", "published"),
            supabase.from("lessons").select("duration_seconds"),
          ]);

        const totalHours = Math.max(
          1,
          Math.round(
            (lessonsData || []).reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) / 3600
          )
        );

        setLiveStats({
          students: override?.students || (studentCount && studentCount > 0 ? studentCount : 1),
          courses: override?.courses || (courseCount && courseCount > 0 ? courseCount : 1),
          hours: override?.hours || (totalHours > 0 ? totalHours : 10),
          projects: override?.projects || 15,
          satisfaction: override?.satisfaction || 99,
        });
      } catch (err) {
        console.error("Stats strip fetch error:", err);
      }
    }

    fetchPlatformStats();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats: StatItem[] = [
    { icon: Users, target: liveStats.students, suffix: "+", labelKey: "students" },
    { icon: BookOpen, target: liveStats.courses, suffix: "+", labelKey: "courses" },
    { icon: Clock, target: liveStats.hours, suffix: "+", labelKey: "hours" },
    { icon: Briefcase, target: liveStats.projects, suffix: "+", labelKey: "projects" },
    { icon: Award, target: liveStats.satisfaction, suffix: "%", labelKey: "satisfaction" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative -mt-8 z-20 container mx-auto px-4 sm:px-6 mb-20"
    >
      <div className="rounded-2xl glass-panel p-6 sm:p-8 shadow-xl shadow-brand-blue/10 border border-border/60">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 divide-y sm:divide-y-0 divide-border/30">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <StatCounter
                key={idx}
                icon={Icon}
                target={stat.target}
                suffix={stat.suffix}
                label={t(stat.labelKey)}
                start={inView}
                delay={idx * 150}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCounter({
  icon: Icon,
  target,
  suffix,
  label,
  start,
  delay,
}: {
  icon: any;
  target: number;
  suffix: string;
  label: string;
  start: boolean;
  delay: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let timer: NodeJS.Timeout;
    const duration = 1800; // 1.8s
    const steps = 40;
    const stepDuration = duration / steps;
    const increment = target / steps;

    timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(interval);
        } else {
          setCount(Math.floor(current));
        }
      }, stepDuration);
    }, delay);

    return () => clearTimeout(timer);
  }, [start, target, delay]);

  return (
    <div className="flex flex-col items-center text-center p-3 sm:p-0">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-blue/15 to-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-blue dark:text-brand-cyan mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
        {count.toLocaleString()}
        <span className="text-brand-cyan ml-0.5 rtl:mr-0.5">{suffix}</span>
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}

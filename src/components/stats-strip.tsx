"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Users, BookOpen, Clock, PlaySquare } from "lucide-react";
import type { PublicPlatformStats } from "@/lib/public-stats";

interface StatItem {
  icon: typeof Users;
  target: number;
  suffix: string;
  labelKey: "students" | "courses" | "lessons" | "hours";
}

function formatNumberLocale(value: number, locale: string): string {
  const numLocale = locale === "ar" ? "ar-EG" : "en-US";
  const hasFraction = !Number.isInteger(value);
  return new Intl.NumberFormat(numLocale, {
    maximumFractionDigits: hasFraction ? 1 : 0,
  }).format(value);
}

export default function StatsStrip({
  currentLocale,
  stats,
}: {
  currentLocale: string;
  stats: PublicPlatformStats;
}) {
  const t = useTranslations("Stats");
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!stats.showStatsStrip) return;

    const fallbackTimer = setTimeout(() => {
      setInView(true);
    }, 600);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          clearTimeout(fallbackTimer);
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [stats.showStatsStrip]);

  if (!stats.showStatsStrip) {
    return null;
  }

  const statItems: StatItem[] = [
    {
      icon: Users,
      target: stats.studentsCount,
      suffix: stats.studentsCount >= 100 ? "+" : "",
      labelKey: "students",
    },
    {
      icon: BookOpen,
      target: stats.publishedCoursesCount,
      suffix: stats.publishedCoursesCount >= 100 ? "+" : "",
      labelKey: "courses",
    },
    {
      icon: PlaySquare,
      target: stats.publishedLessonsCount,
      suffix: stats.publishedLessonsCount >= 100 ? "+" : "",
      labelKey: "lessons",
    },
    {
      icon: Clock,
      target: stats.totalHours,
      suffix: stats.totalHours >= 100 ? "+" : "",
      labelKey: "hours",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative -mt-8 z-20 container mx-auto px-4 sm:px-6 mb-20"
    >
      <div className="rounded-2xl glass-panel p-6 sm:p-8 shadow-xl shadow-brand-blue/10 border border-border/60">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 divide-border/30">
          {statItems.map((stat, idx) => (
            <StatCounter
              key={stat.labelKey}
              icon={stat.icon}
              target={stat.target}
              suffix={stat.suffix}
              label={t(stat.labelKey)}
              locale={currentLocale}
              start={inView}
              delay={idx * 100}
            />
          ))}
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
  locale,
  start,
  delay,
}: {
  icon: typeof Users;
  target: number;
  suffix: string;
  label: string;
  locale: string;
  start: boolean;
  delay: number;
}) {
  // Initialize to real target so SSR & no-JS always display the exact database value
  const [count, setCount] = useState<number>(target);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    setCount(target);
  }, [target]);

  useEffect(() => {
    if (!start || hasAnimatedRef.current || target <= 0) return;
    hasAnimatedRef.current = true;

    let rafId = 0;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      const duration = 1100;
      const isInt = Number.isInteger(target);

      delayTimer = setTimeout(() => {
        const startTime = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const nextValue = target * eased;
          setCount(
            isInt ? Math.round(nextValue) : Math.round(nextValue * 10) / 10
          );

          if (progress < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            setCount(target);
          }
        };
        setCount(0);
        rafId = requestAnimationFrame(tick);
      }, delay);
    } catch {
      setCount(target);
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (rafId) cancelAnimationFrame(rafId);
      setCount(target);
    };
  }, [start, target, delay]);

  return (
    <div className="flex flex-col items-center text-center p-3 sm:p-0">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-blue/15 to-brand-cyan/20 border border-brand-cyan/30 flex items-center justify-center text-brand-blue dark:text-brand-cyan mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
        {formatNumberLocale(count, locale)}
        {suffix && (
          <span className="text-brand-cyan ml-0.5 rtl:mr-0.5">{suffix}</span>
        )}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
        {label}
      </div>
    </div>
  );
}

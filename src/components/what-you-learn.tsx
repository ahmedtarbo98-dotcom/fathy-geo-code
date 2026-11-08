"use client";

import { useTranslations } from "next-intl";
import {
  Map,
  Satellite,
  Compass,
  Layers,
  Code2,
  Workflow,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";

export default function WhatYouLearn({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("Topics");

  const topics = [
    {
      key: "gis",
      icon: Map,
      color: "from-blue-600/20 to-brand-navy/30",
      accent: "text-blue-500",
      border: "group-hover:border-blue-500/50",
    },
    {
      key: "remoteSensing",
      icon: Satellite,
      color: "from-cyan-500/20 to-teal-700/30",
      accent: "text-cyan-400",
      border: "group-hover:border-cyan-400/50",
    },
    {
      key: "surveying",
      icon: Compass,
      color: "from-indigo-600/20 to-blue-900/30",
      accent: "text-indigo-400",
      border: "group-hover:border-indigo-400/50",
    },
    {
      key: "spatialModeling",
      icon: Workflow,
      color: "from-sky-500/20 to-blue-800/30",
      accent: "text-sky-400",
      border: "group-hover:border-sky-400/50",
    },
    {
      key: "gee",
      icon: Code2,
      color: "from-emerald-600/20 to-cyan-900/30",
      accent: "text-emerald-400",
      border: "group-hover:border-emerald-400/50",
    },
    {
      key: "arcgisPro",
      icon: Layers,
      color: "from-blue-700/20 to-brand-cyan/20",
      accent: "text-brand-blue dark:text-brand-cyan",
      border: "group-hover:border-brand-cyan/50",
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-blue/30 bg-brand-blue/10 text-xs font-semibold text-brand-blue dark:text-brand-cyan">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{t("badge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {topics.map((item) => {
            const Icon = item.icon;
            const title = t(`${item.key}.title`);
            const desc = t(`${item.key}.desc`);

            return (
              <div
                key={item.key}
                className={`group relative p-7 rounded-2xl glass-panel border border-border/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-blue/10 ${item.border}`}
              >
                {/* Background soft glow on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl bg-muted/80 flex items-center justify-center border border-border/50 ${item.accent} group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <Link
                      href="/courses"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <span>{currentLocale === "ar" ? "استكشف" : "Explore"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-[-90deg]" />
                    </Link>
                  </div>

                  <h3 className="text-xl font-bold text-foreground group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">
                    {title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

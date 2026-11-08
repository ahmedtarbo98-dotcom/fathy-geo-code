"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Star, Quote, CheckCircle2, Sparkles } from "lucide-react";

interface TestimonialItem {
  id: string;
  student_name_ar: string;
  student_name_en: string;
  student_title_ar: string;
  student_title_en: string;
  content_ar: string;
  content_en: string;
  rating: number;
}

export default function TestimonialsSection({
  currentLocale,
}: {
  currentLocale: string;
}) {
  const t = useTranslations("Testimonials");
  const isRtl = currentLocale === "ar";
  const supabase = createClient();
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const { data, error } = await supabase
          .from("testimonials")
          .select("id, student_name_ar, student_name_en, student_title_ar, student_title_en, content_ar, content_en, rating")
          .eq("is_published", true)
          .order("order_index", { ascending: true });

        if (!error && data) {
          setTestimonials(data);
        }
      } catch (err) {
        console.error("Testimonials load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTestimonials();
  }, []);

  // If no published testimonials exist in DB, don't show empty block
  if (!loading && testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((item) => {
            const name = isRtl ? item.student_name_ar : item.student_name_en;
            const role = isRtl ? item.student_title_ar : item.student_title_en;
            const text = isRtl ? item.content_ar : item.content_en;

            return (
              <div
                key={item.id}
                className="relative rounded-2xl glass-panel p-6 sm:p-8 border border-border/80 shadow-lg hover:shadow-brand-blue/10 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-brand-cyan/20 group-hover:text-brand-cyan/40 transition-colors" />
                  </div>

                  <p className="text-sm leading-relaxed text-foreground/90 italic">
                    "{text}"
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-border/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-navy to-brand-blue text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <span>{name}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan inline" />
                    </h4>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  HelpCircle,
  Users,
  UserCheck,
  Award,
  FileEdit,
  Mail,
  BarChart3,
  Settings,
  ShieldAlert,
  ShieldX,
  ArrowUpRight,
  Menu,
  X,
  Sparkles,
  LogOut,
  Home,
  RefreshCw,
} from "lucide-react";

export default function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const tBrand = useTranslations("Brand");
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const isRtl = locale === "ar";

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isMounted) setIsAdmin(false);
          return;
        }

        setUserEmail(user.email || "");

        // Admin email check or database role check
        if (user.email === "ahmedtarbo98@gmail.com") {
          if (isMounted) setIsAdmin(true);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_blocked")
          .eq("id", user.id)
          .single();

        if (profile?.role === "admin" && !profile?.is_blocked) {
          if (isMounted) setIsAdmin(true);
        } else {
          if (isMounted) setIsAdmin(false);
        }
      } catch (err) {
        console.error("Admin layout verification error:", err);
        if (isMounted) setIsAdmin(false);
      }
    }

    checkAdminAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Loading state
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-blue animate-spin" />
        <p className="text-sm text-muted-foreground font-semibold">
          {isRtl ? "جارٍ التحقق من صلاحيات المدير..." : "Verifying admin access..."}
        </p>
      </div>
    );
  }

  // 2. 403 Forbidden Shield (If not admin)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl glass-panel p-8 text-center space-y-6 border border-red-500/30 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 mx-auto flex items-center justify-center border border-red-500/30">
            <ShieldX className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-500">
              403 Forbidden
            </span>
            <h1 className="text-2xl font-extrabold text-foreground">
              {isRtl ? "وصول محظور" : "Access Denied"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRtl
                ? "هذه المنطقة مخصصة حصرياً لمدير النظام (م. أحمد فتحي). حسابك الحالي ليس لديه صلاحيات الوصول إلى لوحة الإدارة."
                : "This portal is strictly restricted to platform administrators. Your account does not have permission to view this resource."}
            </p>
            {userEmail && (
              <p className="text-xs font-mono text-muted-foreground pt-1">
                {isRtl ? "الحساب المسجل:" : "Signed in as:"} {userEmail}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>{isRtl ? "العودة للرئيسية" : "Back to Home"}</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{isRtl ? "تسجيل الدخول كمدير" : "Admin Login"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Admin Authorized View
  const navItems = [
    { href: "/admin", label: t("overview"), icon: LayoutDashboard },
    { href: "/admin/courses", label: t("courses"), icon: BookOpen },
    { href: "/admin/curriculum", label: t("curriculum"), icon: Layers },
    { href: "/admin/quizzes", label: t("quizzes"), icon: HelpCircle },
    { href: "/admin/students", label: t("students"), icon: Users },
    { href: "/admin/requests", label: t("requests"), icon: UserCheck, badge: "Live" },
    { href: "/admin/certificates", label: t("certificates"), icon: Award },
    { href: "/admin/content", label: t("content"), icon: FileEdit },
    { href: "/admin/messages", label: t("messages"), icon: Mail, badge: "Inbox" },
    { href: "/admin/analytics", label: t("analytics"), icon: BarChart3 },
    { href: "/admin/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-x-hidden w-full">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <span className="font-bold text-sm text-foreground">
            {t("dashboardTitle")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher currentLocale={locale} />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg border border-border"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 border-e border-border/80 bg-card/95 backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 rtl:translate-x-full rtl:md:translate-x-0"
        }`}
      >
        <div className="space-y-6 p-5 overflow-y-auto">
          {/* Brand & Admin Badge */}
          <div className="space-y-2">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-md">
                <div className="relative w-full h-full rounded-[9px] overflow-hidden bg-background">
                  <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-sm text-foreground block">
                  {tBrand("name")}
                </span>
                <span className="text-[10px] font-semibold text-brand-cyan uppercase tracking-wider block">
                  {t("portalBadge")}
                </span>
              </div>
            </Link>
            <div className="px-3 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 text-[11px] font-medium text-brand-cyan flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{userEmail || "ahmedtarbo98@gmail.com"}</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-brand-cyan/15 text-brand-cyan"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/80 space-y-3">
          <div className="hidden md:flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              {locale === "ar" ? "المظهر واللغة" : "Theme & Lang"}
            </span>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60 transition-colors"
          >
            <span>{isRtl ? "معاينة الموقع كزائر" : "View Public Site"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

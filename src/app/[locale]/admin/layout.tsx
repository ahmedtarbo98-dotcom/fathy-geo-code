"use client";

import { useState } from "react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
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
  ArrowUpRight,
  Menu,
  X,
  Sparkles,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/admin", label: t("overview"), icon: LayoutDashboard },
    { href: "/admin/courses", label: t("courses"), icon: BookOpen },
    { href: "/admin/curriculum", label: t("curriculum"), icon: Layers },
    { href: "/admin/quizzes", label: t("quizzes"), icon: HelpCircle },
    { href: "/admin/students", label: t("students"), icon: Users },
    { href: "/admin/requests", label: t("requests"), icon: UserCheck, badge: "2" },
    { href: "/admin/certificates", label: t("certificates"), icon: Award },
    { href: "/admin/content", label: t("content"), icon: FileEdit },
    { href: "/admin/messages", label: t("messages"), icon: Mail, badge: "3" },
    { href: "/admin/analytics", label: t("analytics"), icon: BarChart3 },
    { href: "/admin/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
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
        <div className="space-y-6 p-5">
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
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] pe-1">
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
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-red-500/10 text-red-500"
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

        {/* Bottom User & Site Switch */}
        <div className="p-4 border-t border-border/60 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{tBrand("owner")}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Admin
            </span>
          </div>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted transition-colors text-foreground"
          >
            <span>{t("returnToSite")}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-[-90deg]" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (Desktop) */}
        <header className="hidden md:flex h-16 border-b border-border bg-card/60 backdrop-blur-md items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">
              {t("dashboardTitle")}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-foreground font-semibold">
              {tBrand("ownerTitle")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

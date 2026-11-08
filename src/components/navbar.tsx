"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import {
  Menu,
  X,
  Compass,
  BookOpen,
  User,
  Mail,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function Navbar({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("Nav");
  const tBrand = useTranslations("Brand");
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t("home"), icon: Compass },
    { href: "/courses", label: t("courses"), icon: BookOpen },
    { href: "/about", label: t("about"), icon: User },
    { href: "/contact", label: t("contact"), icon: Mail },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm shadow-brand-navy/5"
          : "bg-background/50 backdrop-blur-md border-b border-border/30"
      }`}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Title */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
        >
          <div className="relative w-12 h-12 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-md shadow-brand-blue/20 group-hover:shadow-brand-cyan/40 transition-shadow">
            <div className="relative w-full h-full rounded-[10px] overflow-hidden bg-background">
              <Image
                src="/logo.jpg"
                alt="FATHY GEO CODE Logo"
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight text-lg sm:text-xl bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan dark:from-white dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              {tBrand("name")}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground tracking-wide flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-brand-cyan inline" />
              {tBrand("tagline")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "text-brand-blue dark:text-brand-cyan font-bold bg-brand-blue/10 dark:bg-brand-cyan/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4 opacity-70" />
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls (Theme, Language, Auth) */}
        <div className="hidden sm:flex items-center gap-2.5">
          <LanguageSwitcher currentLocale={currentLocale} />
          <ThemeToggle />

          <Link
            href="/login"
            className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white overflow-hidden transition-all duration-300 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:shadow-lg hover:shadow-brand-blue/30 hover:scale-105 active:scale-95"
          >
            <GraduationCap className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span>{t("login")}</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher currentLocale={currentLocale} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg border border-border/60 text-foreground hover:bg-muted"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-background/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 transition-all animate-in slide-in-from-top-4">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-brand-blue/15 text-brand-blue dark:text-brand-cyan font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan shadow-md"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t("login")}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

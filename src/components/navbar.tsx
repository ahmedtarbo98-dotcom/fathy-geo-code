"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  Compass,
  BookOpen,
  User,
  Mail,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Award,
  LogOut,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";

interface UserProfile {
  id: string;
  email?: string;
  full_name: string;
  avatar_url?: string;
  role: "student" | "admin";
}

export default function Navbar({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("Nav");
  const tBrand = useTranslations("Brand");
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const supabase = createClient();
  const isRtl = currentLocale === "ar";

  // 1. Listen to Supabase auth state in real time
  useEffect(() => {
    const fetchProfile = async (userId: string, email?: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role, email")
          .eq("id", userId)
          .single();

        if (data) {
          setCurrentUser({
            id: data.id,
            email: data.email || email,
            full_name: data.full_name || email?.split("@")[0] || "User",
            avatar_url: data.avatar_url,
            role: data.role || (email === "ahmedtarbo98@gmail.com" ? "admin" : "student"),
          });
        } else {
          setCurrentUser({
            id: userId,
            email: email,
            full_name: email?.split("@")[0] || "User",
            role: email === "ahmedtarbo98@gmail.com" ? "admin" : "student",
          });
        }
      } catch (err) {
        console.error("Profile fetch error in Navbar:", err);
      }
    };

    // Check active session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchProfile(user.id, user.email);
      } else {
        setCurrentUser(null);
      }
    });

    // Reactive subscription without manual refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Click outside dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logout handler
  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: t("home"), icon: Compass },
    { href: "/courses", label: t("courses"), icon: BookOpen },
    { href: "/about", label: t("about"), icon: User },
    { href: "/contact", label: t("contact"), icon: Mail },
  ];

  // Helper for user initials
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-sm shadow-brand-navy/5"
          : "bg-background/60 backdrop-blur-md border-b border-border/30"
      }`}
    >
      <div className="container mx-auto flex h-16 sm:h-20 items-center justify-between gap-2 px-3 sm:px-6">
        {/* Brand Logo & Title */}
        <Link
          href="/"
          className="group flex items-center gap-2 sm:gap-3 transition-transform duration-300 hover:scale-[1.02] min-w-0"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-md shadow-brand-blue/20 group-hover:shadow-brand-cyan/40 transition-shadow">
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
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold tracking-tight text-sm sm:text-lg lg:text-xl truncate bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan dark:from-white dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
              {tBrand("name")}
            </span>
            <span className="hidden sm:flex text-[10px] sm:text-xs font-medium text-muted-foreground tracking-wide items-center gap-1 truncate">
              <Sparkles className="w-2.5 h-2.5 text-brand-cyan inline shrink-0" />
              <span className="truncate">{tBrand("tagline")}</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
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
        <div className="hidden md:flex items-center gap-2 lg:gap-2.5 shrink-0">
          <LanguageSwitcher currentLocale={currentLocale} />
          <ThemeToggle />

          {currentUser ? (
            /* USER MENU WHEN LOGGED IN */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pe-3 rounded-full border border-border/80 bg-card hover:bg-muted/60 transition-all shadow-sm"
                aria-expanded={userDropdownOpen}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-navy to-brand-cyan text-white text-xs font-extrabold flex items-center justify-center shadow-sm overflow-hidden">
                  {currentUser.avatar_url ? (
                    <Image
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span>{getInitials(currentUser.full_name)}</span>
                  )}
                </div>
                <div className="flex flex-col text-start">
                  <span className="text-xs font-bold text-foreground max-w-[110px] truncate leading-tight">
                    {currentUser.full_name}
                  </span>
                  {currentUser.role === "admin" && (
                    <span className="text-[10px] font-extrabold text-brand-cyan uppercase tracking-wider leading-none">
                      ADMIN
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  className={`absolute top-full mt-2 w-56 rounded-2xl bg-card border border-border/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 ${
                    isRtl ? "left-0" : "right-0"
                  }`}
                >
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {currentUser.full_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {currentUser.email}
                    </p>
                  </div>

                  {/* My Courses */}
                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                    <span>{t("myCourses")}</span>
                  </Link>

                  {/* Profile */}
                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <User className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                    <span>{t("dashboard")}</span>
                  </Link>

                  {/* Certificates */}
                  <Link
                    href="/certificates"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>{isRtl ? "شهاداتي" : "My Certificates"}</span>
                  </Link>

                  {/* Admin Dashboard (ONLY IF ADMIN) */}
                  {currentUser.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-brand-cyan bg-brand-cyan/10 hover:bg-brand-cyan/20 transition-colors my-1 border border-brand-cyan/30"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand-cyan" />
                      <span>{isRtl ? "لوحة الإدارة الكاملة" : "Admin Dashboard"}</span>
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-start mt-1 border-t border-border/50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t("logout")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* LOGIN BUTTON WHEN LOGGED OUT */
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white overflow-hidden transition-all duration-300 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:shadow-lg hover:shadow-brand-blue/30 hover:scale-105 active:scale-95"
            >
              <GraduationCap className="w-4 h-4 transition-transform group-hover:rotate-12" />
              <span>{t("login")}</span>
            </Link>
          )}
        </div>

        {/* Mobile & Tablet menu button */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
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

      {/* Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 transition-all animate-in slide-in-from-top-4">
          {/* User Info Header on Mobile */}
          {currentUser && (
            <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-navy to-brand-cyan text-white text-xs font-extrabold flex items-center justify-center shadow-sm">
                  {currentUser.avatar_url ? (
                    <Image
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(currentUser.full_name)}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {currentUser.full_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              {currentUser.role === "admin" && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
                  ADMIN
                </span>
              )}
            </div>
          )}

          {/* Nav links */}
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

            {/* If logged in on mobile: My Courses, Profile, Certificates, Admin */}
            {currentUser && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  <GraduationCap className="w-4 h-4 text-brand-cyan" />
                  <span>{t("myCourses")}</span>
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  <User className="w-4 h-4 text-brand-blue" />
                  <span>{t("dashboard")}</span>
                </Link>

                <Link
                  href="/certificates"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? "شهاداتي" : "My Certificates"}</span>
                </Link>

                {currentUser.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/30"
                  >
                    <LayoutDashboard className="w-4 h-4 text-brand-cyan" />
                    <span>{isRtl ? "لوحة الإدارة الكاملة" : "Admin Dashboard"}</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Login or Logout */}
          <div className="pt-2 border-t border-border flex flex-col gap-2">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("logout")}</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan shadow-md"
              >
                <GraduationCap className="w-4 h-4" />
                <span>{t("login")}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

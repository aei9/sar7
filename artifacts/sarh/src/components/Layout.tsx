import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, User, Zap, BookOpen, Briefcase, Award,
  Map, MessageCircle, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/profile", label: "ملفي الشخصي", icon: User },
  { href: "/skills", label: "المهارات والفجوات", icon: Zap },
  { href: "/courses", label: "الدورات المقترحة", icon: BookOpen },
  { href: "/jobs", label: "الوظائف المناسبة", icon: Briefcase },
  { href: "/career", label: "المسار المهني", icon: Map },
  { href: "/badges", label: "الأوسمة الرقمية", icon: Award },
  { href: "/chat", label: "المستشار الذكي", icon: MessageCircle },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white shrink-0 p-1">
            <img src="/sarh-logo.png" alt="صرح" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="font-bold text-base text-sidebar-foreground">صرح</p>
            <p className="text-xs text-sidebar-foreground/60">المسار المهني</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-sidebar-accent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shrink-0">
              {user?.avatarInitials ?? "م"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.fullName}</p>
              <p className="text-xs text-sidebar-foreground/60">{user?.profileComplete ? "ملف مكتمل" : "ملف غير مكتمل"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                data-testid={`nav-${href.slice(1)}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={logout}
            data-testid="button-logout"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <img src="/sarh-logo.png" alt="صرح" className="h-8 w-auto object-contain" />
          <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
            {user?.avatarInitials ?? "م"}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

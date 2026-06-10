import Link from "next/link";
import { BookOpen, Building2, GraduationCap, MessageCircle, User, Users } from "lucide-react";
import type { ReactNode } from "react";
import { ActiveNavLink } from "@/components/ActiveNavLink";
import { AppBrowserChrome } from "@/components/AppBrowserChrome";
import { AppToaster } from "@/components/AppToaster";

const navBaseClass =
  "flex flex-col items-center justify-center gap-0.5 px-2 py-1 transition-colors rounded-lg min-w-[60px]";
const navActiveClass = "text-orange-500 bg-orange-50";
const navInactiveClass = "text-gray-600 hover:text-orange-400 hover:bg-orange-50/50";

const navItems = [
  { name: "学校", path: "/school", icon: GraduationCap },
  { name: "課外活動", path: "/activities", icon: Users },
  { name: "記事", path: "/articles", icon: BookOpen },
  { name: "繋がり", path: "/connect", icon: MessageCircle },
  { name: "マイページ", path: "/profile", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FFF9FA] text-gray-800 font-sans">
      <AppToaster />
      <AppBrowserChrome />

      <nav className="sticky top-[var(--hugmeid-nav-top,52px)] z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="flex items-center justify-center px-4 py-2 border-b border-orange-50">
          <Link href="/" prefetch={false} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              Hn
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-gray-800 tracking-tight leading-tight">
                HagNavi
              </h1>
              <p className="text-[9px] text-gray-500 tracking-wide font-light whitespace-nowrap">
                6万人の医学生で創る縁
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <ActiveNavLink
                  key={item.name}
                  href={item.path}
                  className={navBaseClass}
                  activeClassName={navActiveClass}
                  inactiveClassName={navInactiveClass}
                >
                  <Icon size={18} />
                  <span className="text-[10px] font-medium whitespace-nowrap">{item.name}</span>
                </ActiveNavLink>
              );
            })}
          </div>

          <ActiveNavLink
            href="/sponsors"
            className="hidden md:flex flex-col items-center justify-center gap-0.5 px-2 py-1 transition-colors rounded-lg hover:bg-orange-50 ml-1"
            activeClassName="text-orange-500 bg-orange-50"
            inactiveClassName="text-gray-600 hover:text-orange-500"
          >
            <Building2 size={18} />
            <span className="text-[10px] font-medium whitespace-nowrap">スポンサー</span>
          </ActiveNavLink>
        </div>
      </nav>

      <main className="flex-1 overflow-x-hidden pb-16">{children}</main>
    </div>
  );
}

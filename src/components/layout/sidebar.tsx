"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ChevronRight,
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  CreditCard,
  Lightbulb,
  ClipboardList,
  BarChart3,
  PenTool,
  Shield,
  LogOut,
  BookMarked,
  MessageSquare,
  Flag,
  Gift,
  Swords,
  ExternalLink,
  FolderOpen,
  Settings,
  TrendingUp,
  Megaphone,
  Bell,
  Gauge,
  ShieldAlert,
  Headphones,
  Database,
  Mail,
  Search,
  Bot,
  Rocket,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "./notification-bell";
import { useAuthStore } from "@/stores/auth-store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const navEntries: NavEntry[] = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/quick-links", label: "快捷方式", icon: ExternalLink },
  {
    label: "用户与收入",
    icon: Users,
    children: [
      { href: "/users", label: "用户管理", icon: Users },
      { href: "/subscriptions", label: "订阅管理", icon: CreditCard },
      { href: "/paid-users", label: "付费用户", icon: CreditCard },
      { href: "/financials", label: "收支报表", icon: DollarSign },
    ],
  },
  {
    label: "内容管理",
    icon: FolderOpen,
    children: [
      { href: "/test-sets", label: "题库", icon: BookOpen },
      { href: "/questions", label: "题目", icon: FileText },
      { href: "/explanations", label: "解析", icon: Lightbulb },
      { href: "/writing", label: "写作", icon: PenTool },
      { href: "/vocabulary", label: "词汇", icon: BookMarked },
      { href: "/audio-review", label: "音频审核", icon: Headphones },
    ],
  },
  {
    label: "数据分析",
    icon: TrendingUp,
    children: [
      { href: "/analytics", label: "总览", icon: BarChart3 },
      { href: "/attempts", label: "答题记录", icon: ClipboardList },
      { href: "/competitors", label: "竞品分析", icon: Swords },
    ],
  },
  {
    label: "运营",
    icon: Settings,
    children: [
      { href: "/ops", label: "运营工作台", icon: Megaphone },
      { href: "/announcements", label: "消息通知", icon: Bell },
      { href: "/feedback", label: "用户反馈", icon: MessageSquare },
      { href: "/reports", label: "举报", icon: Flag },
      { href: "/metrics", label: "性能监控", icon: Gauge },
      { href: "/anomalies", label: "异常检测", icon: ShieldAlert },
      { href: "/scrape-data", label: "数据采集", icon: Database },
      { href: "/audit", label: "审计日志", icon: Shield },
    ],
  },
  {
    label: "增长",
    icon: Rocket,
    children: [
      { href: "/referrals", label: "推荐奖励", icon: Gift },
      { href: "/emails", label: "邮件日志", icon: Mail },
      { href: "/seo", label: "SEO 优化", icon: Search },
      { href: "/geo", label: "GEO 优化", icon: Bot },
    ],
  },
];

/** Return all child hrefs for a group so we can auto-expand when active */
function groupHrefs(group: NavGroup): string[] {
  return group.children.map((c) => c.href);
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-expand the group that contains the current page
  useEffect(() => {
    for (const entry of navEntries) {
      if (isGroup(entry)) {
        const active = groupHrefs(entry).some((h) => pathname.startsWith(h));
        if (active) {
          setExpanded((prev) => ({ ...prev, [entry.label]: true }));
        }
      }
    }
  }, [pathname]);

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <div className="space-y-0.5">
        {navEntries.map((entry) => {
          if (!isGroup(entry)) {
            const isActive =
              entry.href === "/" ? pathname === "/" : pathname.startsWith(entry.href);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <entry.icon className="h-4 w-4" />
                {entry.label}
              </Link>
            );
          }

          // Group
          const isOpen = expanded[entry.label] ?? false;
          const hasActive = groupHrefs(entry).some((h) => pathname.startsWith(h));

          return (
            <div key={entry.label}>
              <button
                onClick={() => toggle(entry.label)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  hasActive
                    ? "text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <entry.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
              </button>
              {isOpen && (
                <div className="ml-3 space-y-0.5 border-l pl-3">
                  {entry.children.map((child) => {
                    const isActive = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-accent font-medium text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <child.icon className="h-3.5 w-3.5" />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="border-t p-3">
      <button
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <LogOut className="h-4 w-4" />
        退出登录
      </button>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center justify-between border-b px-4">
        <span className="text-lg font-bold">HiTCF Admin</span>
        <NotificationBell />
      </div>
      <SidebarNav />
      <LogoutButton />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="fixed left-0 top-0 z-40 flex h-14 items-center border-b bg-background px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0">
          <div className="flex h-14 items-center border-b px-4">
            <span className="text-lg font-bold">HiTCF Admin</span>
          </div>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <span className="ml-3 text-lg font-bold">HiTCF Admin</span>
    </div>
  );
}

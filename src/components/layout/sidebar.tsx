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
  ClipboardList,
  BarChart3,
  PenTool,
  Shield,
  LogOut,
  BookMarked,
  MessageSquare,
  Gift,
  Swords,
  ExternalLink,
  FolderOpen,
  TrendingUp,
  Megaphone,
  Gauge,
  ShieldAlert,
  Headphones,
  Database,
  Mail,
  Search,
  Sparkles,
  DollarSign,
  Egg,
  Wrench,
  Copy,
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
  {
    label: "客户",
    icon: Users,
    children: [
      { href: "/users", label: "用户管理", icon: Users },
      { href: "/trial-hatch", label: "试用孵化", icon: Egg },
    ],
  },
  {
    label: "收入",
    icon: DollarSign,
    children: [
      { href: "/financials", label: "收支报表", icon: DollarSign },
      { href: "/subscriptions", label: "订阅管理", icon: CreditCard },
      { href: "/referrals", label: "推荐奖励", icon: Gift },
    ],
  },
  {
    label: "内容",
    icon: FolderOpen,
    children: [
      { href: "/test-sets", label: "题库", icon: BookOpen },
      { href: "/questions", label: "题目 & 解析", icon: FileText },
      { href: "/writing", label: "写作", icon: PenTool },
      { href: "/vocabulary", label: "词汇", icon: BookMarked },
      { href: "/audio-review", label: "音频审核", icon: Headphones },
      { href: "/duplicates", label: "重复题管理", icon: Copy },
    ],
  },
  {
    label: "分析",
    icon: TrendingUp,
    children: [
      { href: "/analytics", label: "总览", icon: BarChart3 },
      { href: "/attempts", label: "答题记录", icon: ClipboardList },
      { href: "/feedback", label: "反馈 & 举报", icon: MessageSquare },
      { href: "/audit", label: "审计日志", icon: Shield },
    ],
  },
  {
    label: "工具",
    icon: Wrench,
    children: [
      { href: "/ops", label: "运营工作台", icon: Megaphone },
      { href: "/metrics", label: "性能监控", icon: Gauge },
      { href: "/risk-review", label: "风险 & 异常", icon: ShieldAlert },
      { href: "/scrape-data", label: "数据采集", icon: Database },
      { href: "/seo", label: "SEO 优化", icon: Search },
      { href: "/geo", label: "GEO 优化", icon: Sparkles },
      { href: "/emails", label: "邮件日志", icon: Mail },
      { href: "/competitors", label: "竞品分析", icon: Swords },
      { href: "/quick-links", label: "快捷链接", icon: ExternalLink },
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

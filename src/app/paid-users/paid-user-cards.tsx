"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchSubscriptions, fetchUserDetail } from "@/lib/api/admin";
import type { UserDetail } from "@/lib/api/types";
import { MapPin, Clock, BookOpen, PenTool, Mic, BookMarked, ExternalLink } from "lucide-react";

const PLAN_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  monthly: { label: "月付", variant: "default" },
  quarterly: { label: "季付", variant: "default" },
  yearly: { label: "年付", variant: "default" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "从未";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return `${Math.floor(days / 30)} 个月前`;
}

function daysRemaining(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return "已到期";
  return `${days} 天`;
}

export function PaidUserCards() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [active, trialing] = await Promise.all([
          fetchSubscriptions({ status: "active", page_size: 100 }),
          fetchSubscriptions({ status: "trialing", page_size: 100 }),
        ]);
        const allSubs = [...active.items, ...trialing.items].filter(
          s => s.plan !== "tester" && !s.cancel_at_period_end
        );
        const details = await Promise.all(
          allSubs.map(s => fetchUserDetail(s.user_id).catch(() => null))
        );
        setUsers(details.filter((d): d is UserDetail => d !== null));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex h-40 items-center justify-center"><LoadingSpinner /></div>;

  if (users.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">暂无有效付费用户</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map(user => {
        const plan = user.subscription?.plan || "—";
        const status = user.subscription?.status || "—";
        const badge = PLAN_BADGE[plan];
        const endDate = status === "trialing"
          ? user.subscription?.trial_end
          : user.subscription?.current_period_end;

        return (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{user.name || "—"}</span>
                  {badge && <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>}
                  <Badge variant={status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {status === "trialing" ? "试用" : status === "active" ? "活跃" : status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Location */}
              {user.tracking?.signup_country && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{user.tracking.signup_country}{user.tracking.signup_city ? ` · ${user.tracking.signup_city}` : ""}</span>
                </div>
              )}

              {/* Dates */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>剩余 {daysRemaining(endDate ?? null)} · 最后活跃 {timeAgo(user.last_login_at)}</span>
              </div>

              {/* Activity */}
              <div className="flex flex-wrap gap-3">
                <ActivityBadge icon={BookOpen} label="做题" value={user.activity.answers} />
                <ActivityBadge icon={PenTool} label="写作" value={user.activity.writing} />
                <ActivityBadge icon={Mic} label="口语" value={user.activity.speaking} />
                <ActivityBadge icon={BookMarked} label="词汇" value={user.activity.vocab} />
              </div>

              {/* Link to detail */}
              <Link
                href={`/users/${user.id}`}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                查看详情 <ExternalLink className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ActivityBadge({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
      <Icon className="h-3 w-3" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchUserDetail, activateSubscription, cancelSubscription } from "@/lib/api/admin";
import type { UserDetail } from "@/lib/api/types";
import {
  ArrowLeft, AlertCircle, BarChart3, PenTool, Mic, MessageSquare,
  BookMarked, Flag, CalendarDays, Globe, Monitor, Link2, CreditCard,
  FlaskConical, XCircle,
} from "lucide-react";

const DURATION_OPTIONS = [
  { label: "1 个月", days: 30 },
  { label: "3 个月", days: 90 },
  { label: "半年", days: 180 },
  { label: "1 年", days: 365 },
  { label: "2 年", days: 730 },
  { label: "5 年", days: 1825 },
  { label: "10 年", days: 3650 },
];

const TYPE_COLORS: Record<string, string> = {
  listening: "bg-purple-100 text-purple-800",
  reading: "bg-blue-100 text-blue-800",
  speaking: "bg-green-100 text-green-800",
  writing: "bg-orange-100 text-orange-800",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  abandoned: "bg-gray-100 text-gray-600",
};

function parseUA(ua: string | null): string {
  if (!ua) return "-";
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";
  let browser = "";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  return browser ? `${browser} / ${os}` : os;
}

function formatDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("zh-CN", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatRelative(d: string | null): string {
  if (!d) return "-";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return formatDate(d);
}

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState(365);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserDetail(userId);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleActivateTester = useCallback(async () => {
    setActionLoading(true);
    try {
      await activateSubscription(userId, { plan: "tester", days: selectedDays });
      toast.success(`已激活为体验官（${DURATION_OPTIONS.find(o => o.days === selectedDays)?.label}）`);
      setActivateOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setActionLoading(false);
    }
  }, [userId, load, selectedDays]);

  const handleDeactivateTester = useCallback(async () => {
    setActionLoading(true);
    try {
      await cancelSubscription(userId);
      toast.success("已取消体验官权限");
      setDeactivateOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      setActionLoading(false);
    }
  }, [userId, load]);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner /></div>;
  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={load}>重试</Button>
      </div>
    );
  }

  const activityCards = [
    { label: "做题", value: user.activity.attempts, icon: BarChart3, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
    { label: "写作", value: user.activity.writing, icon: PenTool, color: "text-orange-600 bg-orange-50 dark:bg-orange-950" },
    { label: "口语", value: user.activity.speaking, icon: Mic, color: "text-pink-600 bg-pink-50 dark:bg-pink-950" },
    { label: "AI对话", value: user.activity.conversations, icon: MessageSquare, color: "text-teal-600 bg-teal-50 dark:bg-teal-950" },
    { label: "词汇", value: user.activity.vocab, icon: BookMarked, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
    { label: "举报", value: user.activity.reports, icon: Flag, color: "text-red-600 bg-red-50 dark:bg-red-950" },
    { label: "活跃天数", value: user.activity.active_days, icon: CalendarDays, color: "text-green-600 bg-green-50 dark:bg-green-950" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/users">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <PageHeader title={user.name || user.email} description={user.name ? user.email : undefined} />
      </div>

      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">角色</p>
            <Badge variant={user.role === "admin" ? "default" : "secondary"} className="mt-1">
              {user.role}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">注册时间</p>
            <p className="text-sm font-medium mt-1">{formatDate(user.created_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">最后登录</p>
            <p className="text-sm font-medium mt-1">{formatRelative(user.last_login_at)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">订阅</p>
                {user.subscription ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={user.subscription.status === "active" ? "default" : "secondary"}>
                      {user.subscription.status}
                    </Badge>
                    <span className="text-sm">{user.subscription.plan}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">无</p>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {user.subscription?.plan === "tester" && user.subscription?.status === "active" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => setDeactivateOpen(true)}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  取消体验官
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => { setSelectedDays(365); setActivateOpen(true); }}
                >
                  <FlaskConical className="mr-1 h-3.5 w-3.5" />
                  激活体验官
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div>
        <h2 className="text-lg font-semibold mb-3">活动统计</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          {activityCards.map((c) => (
            <Card key={c.label} className={c.color}>
              <CardContent className="pt-4 pb-3 text-center">
                <c.icon className="h-5 w-5 mx-auto mb-1" />
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs">{c.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tracking Info */}
      {user.tracking && (
        <Card>
          <CardHeader><CardTitle className="text-base">来源追踪</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Globe className="h-3 w-3" /> 注册位置</span>
                <p className="font-medium">{[user.tracking.signup_city, user.tracking.signup_region, user.tracking.signup_country].filter(Boolean).join(", ") || "-"}</p>
              </div>
              <div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Monitor className="h-3 w-3" /> 注册设备</span>
                <p className="font-medium">{parseUA(user.tracking.signup_user_agent)}</p>
              </div>
              <div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Link2 className="h-3 w-3" /> 来源</span>
                <p className="font-medium">{user.tracking.signup_utm_source || user.tracking.signup_referer || "-"}</p>
              </div>
              <div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Monitor className="h-3 w-3" /> 最后登录设备</span>
                <p className="font-medium">{parseUA(user.tracking.last_login_user_agent)}</p>
              </div>
              {user.tracking.signup_ip && (
                <div>
                  <span className="text-xs text-muted-foreground">注册 IP</span>
                  <p className="font-mono text-xs">{user.tracking.signup_ip}</p>
                </div>
              )}
              {user.tracking.last_login_ip && (
                <div>
                  <span className="text-xs text-muted-foreground">最后登录 IP</span>
                  <p className="font-mono text-xs">{user.tracking.last_login_ip}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attempts */}
      <Card>
        <CardHeader><CardTitle className="text-base">最近做题记录</CardTitle></CardHeader>
        <CardContent>
          {user.recent_attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">题库</th>
                    <th className="text-center py-2 font-medium">类型</th>
                    <th className="text-center py-2 font-medium">模式</th>
                    <th className="text-center py-2 font-medium">状态</th>
                    <th className="text-center py-2 font-medium">得分</th>
                    <th className="text-right py-2 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {user.recent_attempts.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-accent/50">
                      <td className="py-2 max-w-[200px] truncate">{a.test_set_name || "-"}</td>
                      <td className="text-center py-2">
                        <Badge variant="secondary" className={TYPE_COLORS[a.test_set_type] || ""}>
                          {a.test_set_type}
                        </Badge>
                      </td>
                      <td className="text-center py-2">{a.mode === "practice" ? "练习" : a.mode === "exam" ? "考试" : a.mode}</td>
                      <td className="text-center py-2">
                        <Badge variant="secondary" className={STATUS_COLORS[a.status] || ""}>
                          {a.status === "completed" ? "完成" : a.status === "in_progress" ? "进行中" : a.status}
                        </Badge>
                      </td>
                      <td className="text-center py-2 font-medium">
                        {a.score != null && a.total != null ? `${a.score}/${a.total}` : "-"}
                      </td>
                      <td className="text-right py-2 text-xs text-muted-foreground">{formatRelative(a.started_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activate Tester Dialog */}
      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-600" />
              激活体验官
            </DialogTitle>
            <DialogDescription>
              为 <span className="font-medium text-foreground">{user.name || user.email}</span> 开通免费 Pro 权限
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">有效期</label>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setSelectedDays(opt.days)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    selectedDays === opt.days
                      ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateOpen(false)} disabled={actionLoading}>
              取消
            </Button>
            <Button onClick={handleActivateTester} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
              {actionLoading ? "处理中..." : "确认激活"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Tester Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              取消体验官
            </DialogTitle>
            <DialogDescription>
              确认取消 <span className="font-medium text-foreground">{user.name || user.email}</span> 的体验官权限？取消后将立即失去 Pro 访问。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={actionLoading}>
              返回
            </Button>
            <Button variant="destructive" onClick={handleDeactivateTester} disabled={actionLoading}>
              {actionLoading ? "处理中..." : "确认取消"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

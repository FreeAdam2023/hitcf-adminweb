"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { fetchUserDetail, fetchUserTimeline, activateSubscription, cancelSubscription } from "@/lib/api/admin";
import type { UserDetail, TimelineEvent } from "@/lib/api/types";
import {
  ArrowLeft, AlertCircle, BarChart3, PenTool, Mic, MessageSquare,
  BookMarked, Flag, CalendarDays, Globe, Monitor, Link2, CreditCard,
  FlaskConical, XCircle, Download, Eye, Headphones, BookOpen, Bot,
  Save, UserPlus, Navigation, LogIn, DollarSign, Languages, Flame,
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

const TIMELINE_CONFIG: Record<string, { icon: typeof BarChart3; label: string; color: string; bg: string; badgeCls: string }> = {
  register:         { icon: UserPlus,     label: "注册",   color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900", badgeCls: "bg-emerald-100 text-emerald-700" },
  attempt_listening: { icon: Headphones,  label: "听力",   color: "text-purple-600",  bg: "bg-purple-100 dark:bg-purple-900",   badgeCls: "bg-purple-100 text-purple-700" },
  attempt_reading:  { icon: BookOpen,     label: "阅读",   color: "text-blue-600",    bg: "bg-blue-100 dark:bg-blue-900",       badgeCls: "bg-blue-100 text-blue-700" },
  attempt:          { icon: BarChart3,    label: "做题",   color: "text-blue-600",    bg: "bg-blue-100 dark:bg-blue-900",       badgeCls: "bg-blue-100 text-blue-700" },
  writing:          { icon: PenTool,      label: "写作",   color: "text-orange-600",  bg: "bg-orange-100 dark:bg-orange-900",   badgeCls: "bg-orange-100 text-orange-700" },
  speaking:         { icon: Mic,          label: "口语",   color: "text-pink-600",    bg: "bg-pink-100 dark:bg-pink-900",       badgeCls: "bg-pink-100 text-pink-700" },
  conversation:     { icon: Bot,          label: "AI对话", color: "text-teal-600",    bg: "bg-teal-100 dark:bg-teal-900",       badgeCls: "bg-teal-100 text-teal-700" },
  vocab_save:       { icon: Save,         label: "收藏",   color: "text-amber-600",   bg: "bg-amber-100 dark:bg-amber-900",     badgeCls: "bg-amber-100 text-amber-700" },
  word_lookup:      { icon: Eye,          label: "查词",   color: "text-cyan-600",    bg: "bg-cyan-100 dark:bg-cyan-900",       badgeCls: "bg-cyan-100 text-cyan-700" },
  email_sent:       { icon: MessageSquare, label: "邮件",  color: "text-sky-600",     bg: "bg-sky-100 dark:bg-sky-900",         badgeCls: "bg-sky-100 text-sky-700" },
  email_failed:     { icon: MessageSquare, label: "邮件失败", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900",         badgeCls: "bg-red-100 text-red-700" },
  event_page_view:  { icon: Navigation,   label: "浏览",   color: "text-slate-500",   bg: "bg-slate-100 dark:bg-slate-900",     badgeCls: "bg-slate-100 text-slate-600" },
  event_page_leave: { icon: Navigation,   label: "停留",   color: "text-slate-500",   bg: "bg-slate-100 dark:bg-slate-900",     badgeCls: "bg-slate-100 text-slate-600" },
  event_login:      { icon: LogIn,        label: "登录",   color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900", badgeCls: "bg-emerald-100 text-emerald-700" },
  event_viewed_pricing: { icon: DollarSign, label: "看定价", color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900", badgeCls: "bg-violet-100 text-violet-700" },
  event_clicked_subscribe: { icon: CreditCard, label: "点订阅", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900", badgeCls: "bg-green-100 text-green-700" },
  event_checkout_started: { icon: CreditCard, label: "结账", color: "text-green-600", bg: "bg-green-100 dark:bg-green-900", badgeCls: "bg-green-100 text-green-700" },
  _default:         { icon: BarChart3,    label: "事件",   color: "text-gray-600",    bg: "bg-gray-100 dark:bg-gray-900",       badgeCls: "bg-gray-100 text-gray-700" },
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
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
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
      const [data, tl] = await Promise.all([
        fetchUserDetail(userId),
        fetchUserTimeline(userId),
      ]);
      setUser(data);
      setTimeline(tl.events);
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
    { label: "答题", value: user.activity.answers, icon: BarChart3, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
    { label: "写作", value: user.activity.writing, icon: PenTool, color: "text-orange-600 bg-orange-50 dark:bg-orange-950" },
    { label: "口语", value: user.activity.speaking, icon: Mic, color: "text-pink-600 bg-pink-50 dark:bg-pink-950" },
    { label: "AI对话", value: user.activity.conversations, icon: MessageSquare, color: "text-teal-600 bg-teal-50 dark:bg-teal-950" },
    { label: "词汇", value: user.activity.vocab, icon: BookMarked, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
    { label: "错题", value: user.activity.wrong_answers, icon: XCircle, color: "text-rose-600 bg-rose-50 dark:bg-rose-950" },
    { label: "导出", value: user.activity.exports, icon: Download, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950" },
    { label: "举报", value: user.activity.reports, icon: Flag, color: "text-red-600 bg-red-50 dark:bg-red-950" },
    { label: "活跃天数", value: user.activity.active_days, icon: CalendarDays, color: "text-green-600 bg-green-50 dark:bg-green-950" },
    { label: "正确率", value: user.accuracy_percent != null ? `${user.accuracy_percent}%` : "-", icon: BarChart3, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
    { label: "连续打卡", value: user.streak_days, icon: Flame, color: "text-orange-600 bg-orange-50 dark:bg-orange-950" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={user.name || user.email} description={user.name ? user.email : undefined} />
      </div>

      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <Languages className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">语言偏好</p>
                <p className="text-sm font-medium mt-1">
                  {{ zh: "中文", en: "English", fr: "Français", ar: "العربية", es: "Español", pt: "Português", hi: "हिन्दी" }[user.ui_language || "zh"] || user.ui_language || "zh"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">订阅</p>
                {user.subscription ? (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={user.subscription.status === "active" ? "default" : "secondary"}>
                        {user.subscription.status}
                      </Badge>
                      <span className="text-sm font-medium">{user.subscription.plan}</span>
                      {user.subscription.user_cancelled && <Badge variant="outline" className="text-xs">已取消</Badge>}
                    </div>
                    {user.subscription.current_period_end && (
                      <p className="text-xs text-muted-foreground">
                        到期: {new Date(user.subscription.current_period_end).toLocaleDateString("zh-CN")}
                        {new Date(user.subscription.current_period_end) < new Date() && (
                          <span className="text-red-500 ml-1">已过期</span>
                        )}
                      </p>
                    )}
                    {user.subscription.stripe_customer_id && (
                      <p className="text-xs text-muted-foreground font-mono">{user.subscription.stripe_customer_id}</p>
                    )}
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
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
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

      {/* Activity Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">活动轨迹</CardTitle></CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无记录</p>
          ) : (
            <div className="relative ml-3 border-l-2 border-muted pl-6 space-y-4">
              {timeline.map((ev, i) => {
                const cfg = TIMELINE_CONFIG[ev.type] || TIMELINE_CONFIG._default;
                const Icon = cfg.icon;
                return (
                  <div key={`${ev.type}-${ev.time}-${i}`} className="relative">
                    <div className={`absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border-2 border-background ${cfg.bg}`}>
                      <Icon className={`h-3 w-3 ${cfg.color}`} />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${cfg.badgeCls}`}>
                            {cfg.label}
                          </Badge>
                          <span className="text-sm truncate">{ev.detail}</span>
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelative(ev.time)}
                      </span>
                    </div>
                  </div>
                );
              })}
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

          {user.subscription?.status === "active" && user.subscription?.plan !== "tester" && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200">
              该用户当前已有 <span className="font-medium">{user.subscription.plan}</span> 订阅，激活体验官将覆盖现有订阅。
            </div>
          )}

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

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchUsers, updateUserRole } from "@/lib/api/admin";
import type { AdminUserItem, PaginatedResponse } from "@/lib/api/types";
import { AlertCircle, RotateCcw, ChevronDown, Globe, Monitor, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function parseUA(ua: string | null): string {
  if (!ua) return "-";
  // Extract OS
  let os = "未知系统";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";
  // Extract browser
  let browser = "";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  return browser ? `${browser} / ${os}` : os;
}

function formatLocation(t: { signup_country?: string | null; signup_city?: string | null; signup_region?: string | null } | null): string {
  if (!t) return "-";
  const parts = [t.signup_city, t.signup_region, t.signup_country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "-";
}

/** Extract a short, human-readable source label from tracking data. */
function formatSource(t: AdminUserItem["tracking"]): string {
  if (!t) return "-";
  // Prefer first_touch_referer (captures the real entry point before OAuth redirects)
  const ref = t.first_touch_referer || t.signup_referer || "";
  const utm = t.signup_utm_source;
  if (utm) return utm;
  if (!ref) return "-";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    // Shorten known domains
    if (host.includes("google")) return "Google";
    if (host.includes("bing")) return "Bing";
    if (host.includes("baidu")) return "Baidu";
    if (host.includes("xiaohongshu") || host.includes("xhslink")) return "小红书";
    if (host.includes("t.co") || host.includes("twitter") || host.includes("x.com")) return "X/Twitter";
    if (host.includes("facebook") || host.includes("fb.")) return "Facebook";
    if (host.includes("chatgpt") || host.includes("openai")) return "ChatGPT";
    if (host.includes("reddit")) return "Reddit";
    if (host.includes("hitcf")) return "直接";
    return host.split(".").slice(-2).join(".");
  } catch {
    return ref.slice(0, 20);
  }
}

const ACTIVITY_OPTIONS = [
  { value: "all", label: "全部活跃度" },
  { value: "active", label: "活跃 (7天内)" },
  { value: "inactive", label: "不活跃 (7-30天)" },
  { value: "dormant", label: "沉睡 (30天+)" },
];

const SUB_FILTER_OPTIONS = [
  { value: "all", label: "全部用户" },
  { value: "paid", label: "付费用户" },
  { value: "trial", label: "试用中" },
  { value: "churned", label: "已流失" },
  { value: "free", label: "免费用��" },
];

function ActivityDot({ lastActiveAt }: { lastActiveAt: string | null }) {
  if (!lastActiveAt) return <span className="inline-block h-2 w-2 rounded-full bg-gray-300" title="从未活跃" />;
  const days = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86400000);
  if (days <= 7) return <span className="inline-block h-2 w-2 rounded-full bg-green-500" title={`${days}天前活跃`} />;
  if (days <= 30) return <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" title={`${days}天前活跃`} />;
  return <span className="inline-block h-2 w-2 rounded-full bg-gray-400" title={`${days}天前活跃`} />;
}

export function UserList() {
  const [data, setData] = useState<PaginatedResponse<AdminUserItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activityStatus, setActivityStatus] = useState("all");
  const [subFilter, setSubFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers({
        search: search || undefined,
        activity_status: activityStatus !== "all" ? activityStatus : undefined,
        sub_filter: subFilter !== "all" ? subFilter : undefined,
        page,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载用户失败");
    } finally {
      setLoading(false);
    }
  }, [search, activityStatus, subFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      toast.success("用户角色已更新");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新角色失败");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("zh-CN");
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="按邮箱搜索..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Select value={subFilter} onValueChange={(v) => { setSubFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUB_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activityStatus} onValueChange={(v) => { setActivityStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            <RotateCcw className="mr-1 h-3 w-3" /> 重试
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="未找到用户" description="请调整搜索条件" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>订阅</TableHead>
                <TableHead className="text-center">答题</TableHead>
                <TableHead className="text-center">收藏</TableHead>
                <TableHead className="text-center">错题</TableHead>
                <TableHead className="text-center">监控</TableHead>
                <TableHead className="text-center">活跃</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>最后登录</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((u) => (
                <>
                  <TableRow
                    key={u.id}
                    className="cursor-pointer"
                    onClick={() => toggleExpand(u.id)}
                  >
                    <TableCell>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          expandedId === u.id && "rotate-180",
                        )}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/users/${u.id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{u.email}</Link>
                      {u.is_locked && (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          已锁定
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{u.name || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u.id, v)}
                      >
                        <SelectTrigger
                          className="w-24 h-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">用户</SelectItem>
                          <SelectItem value="admin">管理员</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.subscription_status === "active" ? "default" : "secondary"}>
                        {u.subscription_status || "无"}
                      </Badge>
                      {u.subscription_end && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {u.subscription_plan && <span>{u.subscription_plan} · </span>}
                          {new Date(u.subscription_end) < new Date()
                            ? <span className="text-red-500">已过期</span>
                            : new Date(u.subscription_end).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{u.activity?.answers ?? 0}</TableCell>
                    <TableCell className="text-center">{u.activity?.saved_words ?? 0}</TableCell>
                    <TableCell className="text-center">{u.activity?.wrong_answers ?? 0}</TableCell>
                    <TableCell className="text-center">{u.activity?.seat_watches ?? 0}</TableCell>
                    <TableCell className="text-center"><ActivityDot lastActiveAt={u.last_active_at} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatSource(u.tracking)}</TableCell>
                    <TableCell>{formatDate(u.created_at)}</TableCell>
                    <TableCell>{formatDate(u.last_login_at)}</TableCell>
                  </TableRow>
                  {expandedId === u.id && (
                    <TableRow key={`${u.id}-detail`}>
                      <TableCell colSpan={13} className="bg-muted/30">
                        <div className="space-y-3 px-4 py-3 text-sm">
                          {/* Row 1: Basic info */}
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div>
                              <span className="text-xs text-muted-foreground">订阅</span>
                              <p className="font-medium">{u.subscription_status || "无"}{u.subscription_plan ? ` (${u.subscription_plan})` : ""}</p>
                              {u.subscription_end && (
                                <p className="text-xs text-muted-foreground">
                                  到期: {new Date(u.subscription_end).toLocaleDateString("zh-CN")}
                                </p>
                              )}
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">角色</span>
                              <p className="font-medium capitalize">{u.role}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">注册时间</span>
                              <p className="font-medium">{formatDateTime(u.created_at)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">最后登录</span>
                              <p className="font-medium">{formatDateTime(u.last_login_at)}</p>
                            </div>
                          </div>
                          {/* Row 2: Tracking - Location & Device */}
                          <div className="border-t pt-3">
                            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">追踪信息</p>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                              <div>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Globe className="h-3 w-3" /> 位置
                                </span>
                                <p className="font-medium">{formatLocation(u.tracking)}</p>
                              </div>
                              <div>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Monitor className="h-3 w-3" /> 注册设备
                                </span>
                                <p className="font-medium">{parseUA(u.tracking?.signup_user_agent ?? null)}</p>
                              </div>
                              <div>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Link2 className="h-3 w-3" /> 来源
                                </span>
                                <p className="font-medium">
                                  {u.tracking?.signup_utm_source || u.tracking?.signup_referer || "-"}
                                </p>
                                {u.tracking?.first_touch_referer && u.tracking.first_touch_referer !== u.tracking.signup_referer && (
                                  <p className="text-xs text-muted-foreground mt-0.5" title={u.tracking.first_touch_referer}>
                                    首次来源: {formatSource({ ...u.tracking, signup_referer: null, signup_utm_source: null })}
                                  </p>
                                )}
                              </div>
                              <div>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Monitor className="h-3 w-3" /> 最后登录设备
                                </span>
                                <p className="font-medium">{parseUA(u.tracking?.last_login_user_agent ?? null)}</p>
                              </div>
                            </div>
                          </div>
                          {/* Row 3: IPs & UTM details (collapsible) */}
                          {u.tracking && (u.tracking.signup_ip || u.tracking.signup_utm_medium || u.tracking.signup_utm_campaign) && (
                            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground md:grid-cols-4">
                              <div>
                                <span>注册IP</span>
                                <p className="font-mono text-foreground">{u.tracking.signup_ip || "-"}</p>
                              </div>
                              <div>
                                <span>最后登录IP</span>
                                <p className="font-mono text-foreground">{u.tracking.last_login_ip || "-"}</p>
                              </div>
                              {u.tracking.signup_utm_medium && (
                                <div>
                                  <span>UTM 媒介</span>
                                  <p className="text-foreground">{u.tracking.signup_utm_medium}</p>
                                </div>
                              )}
                              {u.tracking.signup_utm_campaign && (
                                <div>
                                  <span>UTM 活动</span>
                                  <p className="text-foreground">{u.tracking.signup_utm_campaign}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
          <Pagination page={data.page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Mail, AlertTriangle, CheckCircle2, Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/shared/pagination";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchEmailLogs, fetchEmailStats, fetchEmailDetail } from "@/lib/api/admin";
import type { EmailLogItem, EmailStatsResponse, EmailDetail, PaginatedResponse } from "@/lib/api/types";

const EMAIL_TYPES = [
  { value: "", label: "全部类型" },
  { value: "verification", label: "验证码" },
  { value: "inactive-reminder", label: "召回邮件" },
  { value: "cancellation", label: "取消确认" },
  { value: "admin_alert", label: "管理员告警" },
  { value: "subscription_new", label: "新订阅" },
  { value: "subscription_activated", label: "付费激活" },
  { value: "subscription_cancelled", label: "订阅取消" },
  { value: "referral", label: "推荐奖励" },
  { value: "password_reset", label: "密码重置" },
  { value: "daily_digest", label: "每日摘要" },
];

export function EmailList() {
  const [data, setData] = useState<PaginatedResponse<EmailLogItem> | null>(null);
  const [stats, setStats] = useState<EmailStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [emailType, setEmailType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // Email detail preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<EmailDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchEmailLogs({
        search: search || undefined,
        email_type: emailType || undefined,
        status: status || undefined,
        page,
        page_size: 20,
      });
      setData(result);
    } catch {
      toast.error("加载邮件日志失败");
    } finally {
      setLoading(false);
    }
  }, [search, emailType, status, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetchEmailStats().then(setStats).catch(() => {});
  }, []);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handlePreview = async (emailId: string) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const detail = await fetchEmailDetail(emailId);
      setPreviewData(detail);
    } catch {
      toast.error("加载邮件内容失败");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total_sent}</p>
                <p className="text-xs text-muted-foreground">已发送</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total_failed}</p>
                <p className="text-xs text-muted-foreground">失败</p>
              </div>
            </CardContent>
          </Card>
          {Object.entries(stats.by_type).slice(0, 2).map(([type, counts]) => (
            <Card key={type}>
              <CardContent className="flex items-center gap-3 p-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{counts.sent + (counts.failed || 0)}</p>
                  <p className="text-xs text-muted-foreground">{type}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="搜索邮箱..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-xs"
        />
        <Select value={emailType} onValueChange={(v) => { setEmailType(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            {EMAIL_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value || "all"}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="sent">已发送</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="暂无邮件记录" />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>收件人</TableHead>
                <TableHead>主题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((log) => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-accent/50" onClick={() => handlePreview(log.id)}>
                  <TableCell className="font-mono text-sm">
                    {log.user_id ? (
                      <Link
                        href={`/users/${log.user_id}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {log.to}
                      </Link>
                    ) : (
                      log.to
                    )}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm">
                    {log.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.email_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.status === "sent" ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                        已发送
                      </Badge>
                    ) : (
                      <Badge variant="destructive" title={log.error || undefined}>
                        失败
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("zh-CN")}
                  </TableCell>
                  <TableCell>
                    {log.has_body && (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={data.total_pages} onPageChange={setPage} />
        </>
      )}

      {/* Email Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">
                {previewData?.subject || "邮件详情"}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setPreviewOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {previewData && (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>收件人: <span className="font-mono">{previewData.to}</span></p>
                <p>类型: <Badge variant="outline" className="text-xs ml-1">{previewData.email_type}</Badge></p>
                <p>时间: {new Date(previewData.created_at).toLocaleString("zh-CN")}</p>
                {previewData.error && (
                  <p className="text-destructive">错误: {previewData.error}</p>
                )}
              </div>
            )}
          </DialogHeader>
          {previewLoading ? (
            <div className="flex h-32 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : previewData?.html_body ? (
            <div className="mt-4 rounded-lg border bg-white p-4">
              <iframe
                srcDoc={previewData.html_body}
                className="w-full min-h-[300px] border-0"
                sandbox=""
                title="Email preview"
              />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              该邮件无保存内容（旧邮件不包含 HTML 正文）
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

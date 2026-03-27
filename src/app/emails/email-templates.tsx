"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { get } from "@/lib/api/client";
import {
  Clock, Globe, Send, AlertTriangle, CheckCircle2,
  Mail, UserPlus, Bell, CreditCard, Gift, Shield,
  BarChart3, Megaphone, Eye,
} from "lucide-react";

interface EmailTemplate {
  type: string;
  name: string;
  description: string;
  trigger: string;
  timing: string;
  target: string;
  languages: string[];
  category: string;
  total_sent: number;
  total_failed: number;
  success_rate: number | null;
  sent_30d: number;
  failed_30d: number;
  last_sent_at: string | null;
  recalled: number;
  recall_total: number;
  recall_rate: number | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  transactional: { label: "交易", color: "bg-blue-100 text-blue-700" },
  "re-engagement": { label: "召回", color: "bg-amber-100 text-amber-700" },
  admin: { label: "管理", color: "bg-gray-100 text-gray-700" },
};

const ICON_MAP: Record<string, typeof Mail> = {
  verification: Mail,
  "inactive-reminder": UserPlus,
  "dormant-reminder": Bell,
  "trial-reminder": Clock,
  subscription_new: CreditCard,
  subscription_activated: CheckCircle2,
  subscription_cancelled: AlertTriangle,
  referral: Gift,
  password_reset: Shield,
  daily_digest: BarChart3,
  admin_alert: Megaphone,
};

function formatRelative(d: string | null): string {
  if (!d) return "从未";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(d).toLocaleDateString("zh-CN");
}

const PREVIEW_LANGS = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "ar", label: "العربية" },
];

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [previewLang, setPreviewLang] = useState("zh");
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadPreview = async (type: string, lang: string) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewType(type);
    setPreviewLang(lang);
    try {
      const res = await get<{ subject: string; html: string }>(
        `/api/admin/emails/templates/preview/${type}?lang=${lang}`
      );
      setPreviewSubject(res.subject);
      setPreviewHtml(res.html);
    } catch {
      toast.error("加载预览失败");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    get<{ templates: EmailTemplate[] }>("/api/admin/emails/templates")
      .then((res) => setTemplates(res.templates))
      .catch(() => toast.error("加载模板失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  // Group by category
  const grouped: Record<string, EmailTemplate[]> = {};
  for (const t of templates) {
    const cat = t.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(t);
  }

  const categoryOrder = ["re-engagement", "transactional", "admin"];

  return (
    <div className="space-y-6 mt-4">
      {categoryOrder.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const cfg = CATEGORY_CONFIG[cat] || { label: cat, color: "bg-gray-100 text-gray-700" };
        return (
          <div key={cat} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {cfg.label}邮件
            </h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {items.map((t) => {
                const Icon = ICON_MAP[t.type] || Mail;
                const total = t.total_sent + t.total_failed;
                return (
                  <Card key={t.type} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-semibold">{t.name}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{t.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {t.languages.map((l) => (
                            <Badge key={l} variant="outline" className="text-[9px] px-1 py-0">
                              {l}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">{t.description}</p>

                      <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          触发
                        </div>
                        <div className="font-medium">{t.trigger}</div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          时机
                        </div>
                        <div>{t.timing}</div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                          <UserPlus className="h-3 w-3" />
                          对象
                        </div>
                        <div>{t.target}</div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 border-t pt-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Send className="h-3 w-3 text-green-600" />
                          <span className="font-semibold">{t.total_sent}</span>
                          <span className="text-muted-foreground">已发送</span>
                        </div>
                        {t.total_failed > 0 && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            <span className="font-semibold text-red-600">{t.total_failed}</span>
                            <span className="text-muted-foreground">失败</span>
                          </div>
                        )}
                        {t.success_rate !== null && total > 0 && (
                          <Badge variant="secondary" className={`text-[10px] ${t.success_rate >= 95 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {t.success_rate}% 成功率
                          </Badge>
                        )}
                        {t.recall_rate !== null && (
                          <div className="flex items-center gap-1">
                            <span className={`font-semibold ${t.recall_rate >= 20 ? "text-green-600" : "text-amber-600"}`}>
                              {t.recall_rate}%
                            </span>
                            <span className="text-muted-foreground">召回率</span>
                            <span className="text-muted-foreground">({t.recalled}/{t.recall_total})</span>
                          </div>
                        )}
                        <div className="ml-auto text-muted-foreground">
                          近30天 {t.sent_30d}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        {t.last_sent_at && (
                          <div className="text-[11px] text-muted-foreground">
                            最近发送: {formatRelative(t.last_sent_at)}
                          </div>
                        )}
                        {["verification", "inactive-reminder", "dormant-reminder", "trial-reminder", "password_reset"].includes(t.type) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs"
                            onClick={() => loadPreview(t.type, "zh")}
                          >
                            <Eye className="h-3 w-3" /> 预览
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">邮件预览</DialogTitle>
            <div className="flex items-center gap-3 pt-2">
              <Select value={previewLang} onValueChange={(v) => loadPreview(previewType, v)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PREVIEW_LANGS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {previewSubject && (
                <p className="text-sm text-muted-foreground truncate flex-1">
                  主题: {previewSubject}
                </p>
              )}
            </div>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
          ) : previewHtml ? (
            <div className="mt-2 rounded-lg border bg-white p-1">
              <iframe
                srcDoc={previewHtml}
                className="w-full min-h-[400px] border-0"
                sandbox=""
                title="Email preview"
              />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无预览</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

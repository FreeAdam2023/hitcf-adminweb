"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "@/lib/api/admin";
import type { AnnouncementItem } from "@/lib/api/types";
import {
  AlertCircle,
  Megaphone,
  Plus,
  Sparkles,
  Wrench,
  Bug,
  Trash2,
} from "lucide-react";

const TYPE_ICONS: Record<string, typeof Sparkles> = {
  feature: Sparkles,
  improvement: Wrench,
  fix: Bug,
  news: Megaphone,
};

const TYPE_LABELS: Record<string, string> = {
  feature: "新功能",
  improvement: "优化改进",
  fix: "Bug 修复",
  news: "公告",
};

const LOCALES = ["zh", "en", "fr", "ar"] as const;
const LOCALE_LABELS: Record<string, string> = {
  zh: "中文",
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formType, setFormType] = useState("feature");
  const [formTitles, setFormTitles] = useState<Record<string, string>>({
    zh: "",
    en: "",
    fr: "",
    ar: "",
  });
  const [formContents, setFormContents] = useState<Record<string, string>>({
    zh: "",
    en: "",
    fr: "",
    ar: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAnnouncements({ page: 1, page_size: 50 });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!formTitles.zh && !formTitles.en) return;
    setCreating(true);
    try {
      await createAnnouncement({
        title: formTitles,
        content: formContents,
        type: formType,
      });
      setDialogOpen(false);
      setFormTitles({ zh: "", en: "", fr: "", ar: "" });
      setFormContents({ zh: "", en: "", fr: "", ar: "" });
      setFormType("feature");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条通知？")) return;
    try {
      await deleteAnnouncement(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">消息通知管理</h1>
          <p className="text-sm text-muted-foreground">
            管理平台更新通知，用户会在导航栏看到铃铛提示
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          发布通知
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              暂无通知
            </CardContent>
          </Card>
        ) : (
          items.map((item) => {
            const Icon = TYPE_ICONS[item.type] || Megaphone;
            return (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      {item.title.zh || item.title.en || "—"}
                    </CardTitle>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {item.content.zh || item.content.en || "—"}
                  </p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>
                      {new Date(item.published_at).toLocaleString("zh-CN")}
                    </span>
                    {item.created_by && <span>{item.created_by}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>发布新通知</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>类型</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {LOCALES.map((loc) => (
              <div key={loc} className="space-y-2 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {LOCALE_LABELS[loc]}
                </p>
                <Input
                  placeholder={`标题 (${loc})`}
                  value={formTitles[loc] || ""}
                  onChange={(e) =>
                    setFormTitles((prev) => ({
                      ...prev,
                      [loc]: e.target.value,
                    }))
                  }
                />
                <Textarea
                  placeholder={`内容 (${loc})`}
                  rows={2}
                  value={formContents[loc] || ""}
                  onChange={(e) =>
                    setFormContents((prev) => ({
                      ...prev,
                      [loc]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}

            <Button
              onClick={handleCreate}
              disabled={creating || (!formTitles.zh && !formTitles.en)}
              className="w-full"
            >
              {creating ? "发布中..." : "发布通知"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

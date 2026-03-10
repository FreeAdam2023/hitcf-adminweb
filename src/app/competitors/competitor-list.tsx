"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  fetchCompetitors,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor,
} from "@/lib/api/admin";
import type { CompetitorItem, CompetitorFeature } from "@/lib/api/types";

const DEFAULT_FEATURES: CompetitorFeature[] = [
  { name: "听力练习", value: "", score: 0 },
  { name: "阅读练习", value: "", score: 0 },
  { name: "口语练习", value: "", score: 0 },
  { name: "写作练习", value: "", score: 0 },
  { name: "AI 解析", value: "", score: 0 },
  { name: "词汇工具", value: "", score: 0 },
  { name: "模考模式", value: "", score: 0 },
  { name: "发音训练", value: "", score: 0 },
  { name: "移动端支持", value: "", score: 0 },
  { name: "价格", value: "", score: 0 },
  { name: "免费额度", value: "", score: 0 },
  { name: "多语言", value: "", score: 0 },
];

interface FormData {
  name: string;
  url: string;
  description: string;
  tags: string;
  status: string;
  pricing_free: string;
  pricing_paid: string;
  notes: string;
  strengths: string;
  weaknesses: string;
  monitor_enabled: boolean;
  order: number;
  features: CompetitorFeature[];
}

const emptyForm: FormData = {
  name: "",
  url: "",
  description: "",
  tags: "",
  status: "active",
  pricing_free: "",
  pricing_paid: "",
  notes: "",
  strengths: "",
  weaknesses: "",
  monitor_enabled: false,
  order: 0,
  features: DEFAULT_FEATURES.map((f) => ({ ...f })),
};

function statusColor(s: string) {
  if (s === "active") return "default";
  if (s === "inactive") return "secondary";
  return "destructive";
}

export function CompetitorList() {
  const [items, setItems] = useState<CompetitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCompetitors({ search: search || undefined, page_size: 50 });
      setItems(res.items);
    } catch {
      toast.error("加载竞品列表失败");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, features: DEFAULT_FEATURES.map((f) => ({ ...f })) });
    setDialogOpen(true);
  };

  const openEdit = (item: CompetitorItem) => {
    setEditingId(item.id);
    const features = DEFAULT_FEATURES.map((df) => {
      const existing = item.features.find((f) => f.name === df.name);
      return existing ? { ...existing } : { ...df };
    });
    // add any extra features from competitor not in defaults
    for (const f of item.features) {
      if (!features.find((x) => x.name === f.name)) {
        features.push({ ...f });
      }
    }
    setForm({
      name: item.name,
      url: item.url,
      description: item.description || "",
      tags: item.tags.join(", "),
      status: item.status,
      pricing_free: item.pricing_free || "",
      pricing_paid: item.pricing_paid || "",
      notes: item.notes || "",
      strengths: item.strengths || "",
      weaknesses: item.weaknesses || "",
      monitor_enabled: item.monitor_enabled,
      order: item.order,
      features,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.url) {
      toast.error("名称和网址为必填项");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        url: form.url,
        description: form.description || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: form.status,
        pricing_free: form.pricing_free || null,
        pricing_paid: form.pricing_paid || null,
        notes: form.notes || null,
        strengths: form.strengths || null,
        weaknesses: form.weaknesses || null,
        monitor_enabled: form.monitor_enabled,
        order: form.order,
        features: form.features.filter((f) => f.value.trim()),
      };
      if (editingId) {
        await updateCompetitor(editingId, payload);
        toast.success("竞品已更新");
      } else {
        await createCompetitor(payload);
        toast.success("竞品已创建");
      }
      setDialogOpen(false);
      load();
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCompetitor(deleteId);
      toast.success("竞品已删除");
      setDeleteId(null);
      load();
    } catch {
      toast.error("删除失败");
    }
  };

  const updateFeature = (index: number, field: keyof CompetitorFeature, value: string | number) => {
    setForm((prev) => {
      const features = [...prev.features];
      features[index] = { ...features[index], [field]: value };
      return { ...prev, features };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="搜索竞品..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" /> 添加竞品
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">加载中...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          暂无竞品数据，点击「添加竞品」开始录入。
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expandedId === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <Badge variant={statusColor(item.status)}>{item.status}</Badge>
                      {item.tags.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {item.url} <ExternalLink className="h-3 w-3" />
                    </a>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.pricing_paid && (
                    <span className="text-xs text-muted-foreground mr-2">{item.pricing_paid}</span>
                  )}
                  {item.last_check && (
                    <span className={`inline-block h-2 w-2 rounded-full mr-2 ${item.last_check.is_up ? "bg-green-500" : "bg-red-500"}`} title={item.last_check.is_up ? "在线" : "宕机"} />
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="border-t px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">优势</h4>
                    <p className="text-muted-foreground">{item.strengths || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">劣势</h4>
                    <p className="text-muted-foreground">{item.weaknesses || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">免费额度</h4>
                    <p className="text-muted-foreground">{item.pricing_free || "-"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">备注</h4>
                    <p className="text-muted-foreground">{item.notes || "-"}</p>
                  </div>
                  {item.features.length > 0 && (
                    <div className="col-span-2">
                      <h4 className="font-medium mb-2">功能对比</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {item.features.map((f) => (
                          <div key={f.name} className="flex items-center gap-2">
                            <span className="text-muted-foreground">{f.name}:</span>
                            <span>{f.value}</span>
                            <span className="text-xs text-muted-foreground">({f.score}/5)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑竞品" : "添加竞品"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>名称 *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>网址 *</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
              </div>
            </div>

            <div>
              <Label>描述</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>标签 (逗号分隔)</Label>
                <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="TCF, TEF" />
              </div>
              <div>
                <Label>状态</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="active">运营中</option>
                  <option value="inactive">已停用</option>
                  <option value="defunct">已关闭</option>
                </select>
              </div>
              <div>
                <Label>排序</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>免费额度</Label>
                <Input value={form.pricing_free} onChange={(e) => setForm({ ...form, pricing_free: e.target.value })} placeholder="例: 3套免费试题" />
              </div>
              <div>
                <Label>付费方案</Label>
                <Input value={form.pricing_paid} onChange={(e) => setForm({ ...form, pricing_paid: e.target.value })} placeholder="例: $9.90-$49.90/月" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>优势</Label>
                <Textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>劣势</Label>
                <Textarea value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} rows={2} />
              </div>
            </div>

            <div>
              <Label>备注</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.monitor_enabled}
                onCheckedChange={(v) => setForm({ ...form, monitor_enabled: !!v })}
              />
              <Label className="cursor-pointer">启用网站监控</Label>
            </div>

            {/* Feature Scores */}
            <div>
              <Label className="mb-2 block">功能对比 (留空则跳过)</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {form.features.map((f, i) => (
                  <div key={f.name} className="grid grid-cols-[1fr_1.5fr_80px] gap-2 items-center">
                    <span className="text-sm">{f.name}</span>
                    <Input
                      value={f.value}
                      onChange={(e) => updateFeature(i, "value", e.target.value)}
                      placeholder="描述..."
                      className="h-8 text-sm"
                    />
                    <select
                      value={f.score}
                      onChange={(e) => updateFeature(i, "score", Number(e.target.value))}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}/5</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : editingId ? "更新" : "创建"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除竞品?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该竞品记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
